import { useState, useEffect, useCallback } from 'react';
import {
    createCameraFingerprint,
    storeDeviceMapping,
    getStoredFingerprint,
    findDeviceByFingerprint,
    generateCameraName
} from '../utils/cameraFingerprint';

/**
 * Hook personalizado para gestión robusta de cámaras con identificación persistente
 */
export function useCameraManager() {
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Escanea y caracteriza todas las cámaras disponibles
     */
    const scanCameras = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('La cámara no está disponible en este navegador o entorno no seguro (requiere HTTPS o localhost)');
                setCameras([]);
                return;
            }

            // Solicitar permisos
            await navigator.mediaDevices.getUserMedia({ video: true });

            // Enumerar dispositivos
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');

            if (videoDevices.length === 0) {
                setError('No se encontraron cámaras conectadas');
                setCameras([]);
                return;
            }

            // Procesar cada dispositivo
            const processedCameras = [];

            for (const device of videoDevices) {
                try {
                    // Probar acceso para obtener características reales
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: { exact: device.deviceId } }
                    });

                    const track = stream.getVideoTracks()[0];
                    const settings = track.getSettings();
                    const capabilities = track.getCapabilities();

                    // Crear fingerprint persistente
                    const fingerprint = createCameraFingerprint(device, settings, capabilities);

                    // Almacenar mapeo persistente
                    storeDeviceMapping(device.deviceId, fingerprint);

                    const cameraInfo = {
                        deviceId: device.deviceId,
                        label: device.label,
                        fingerprint,
                        name: generateCameraName(device, settings, capabilities, fingerprint),
                        width: settings.width || 0,
                        height: settings.height || 0,
                        facingMode: settings.facingMode,
                        capabilities,
                        isAvailable: true
                    };

                    processedCameras.push(cameraInfo);
                    stream.getTracks().forEach(track => track.stop());

                } catch (probeError) {
                    console.warn(`Error probando cámara ${device.deviceId}:`, probeError);

                    // Crear entrada básica con fingerprint existente o nuevo
                    let fingerprint = getStoredFingerprint(device.deviceId);
                    if (!fingerprint) {
                        fingerprint = createCameraFingerprint(device, null, null);
                        storeDeviceMapping(device.deviceId, fingerprint);
                    }

                    const basicInfo = {
                        deviceId: device.deviceId,
                        label: device.label,
                        fingerprint,
                        name: generateCameraName(device, null, null, fingerprint),
                        isAvailable: false,
                        error: 'No se pudo acceder para caracterización completa'
                    };

                    processedCameras.push(basicInfo);
                }
            }

            setCameras(processedCameras);

            // Seleccionar cámara por defecto (preferir trasera disponible)
            if (processedCameras.length > 0 && !selectedCameraId) {
                const availableCameras = processedCameras.filter(cam => cam.isAvailable);
                const backCamera = availableCameras.find(cam => cam.facingMode === 'environment');
                const defaultCamera = backCamera || availableCameras[0] || processedCameras[0];
                setSelectedCameraId(defaultCamera.deviceId);
            }

        } catch (err) {
            console.error('Error escaneando cámaras:', err);
            setError(`Error detectando cámaras: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCameraId]);

    /**
     * Actualiza la lista de cámaras
     */
    const refreshCameras = useCallback(async () => {
        await scanCameras();
    }, [scanCameras]);

    /**
     * Selecciona una cámara por fingerprint (persistente)
     */
    const selectCameraByFingerprint = useCallback((fingerprint) => {
        const camera = findDeviceByFingerprint(cameras, fingerprint);
        if (camera) {
            setSelectedCameraId(camera.deviceId);
            return true;
        }
        return false;
    }, [cameras]);

    /**
     * Obtiene información de la cámara seleccionada
     */
    const getSelectedCamera = useCallback(() => {
        return cameras.find(cam => cam.deviceId === selectedCameraId);
    }, [cameras, selectedCameraId]);

    /**
     * Valida que la cámara activa corresponda con la seleccionada
     * Útil después de iniciar un scanner para verificar consistencia
     */
    const validateActiveCamera = useCallback(async (activeStream) => {
        if (!activeStream || !selectedCameraId) return false;

        try {
            const tracks = activeStream.getVideoTracks();
            if (tracks.length === 0) return false;

            const track = tracks[0];
            const settings = track.getSettings();

            // Comparar deviceId del track activo con el seleccionado
            const activeDeviceId = settings.deviceId;

            if (activeDeviceId === selectedCameraId) {
                return true; // ✅ Coincide
            }


            return false; // ❌ No coincide
        } catch (err) {
            console.error('Error validando cámara activa:', err);
            return false;
        }
    }, [selectedCameraId]);

    /**
     * Verifica si hay cámaras disponibles
     */
    const hasCameras = cameras.length > 0;

    /**
     * Verifica si la cámara seleccionada está disponible
     */
    const isSelectedCameraAvailable = () => {
        const selected = getSelectedCamera();
        return selected?.isAvailable || false;
    };

    // Escanear cámaras al montar
    useEffect(() => {
        scanCameras();
    }, [scanCameras]);

    // Escuchar cambios en dispositivos
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) return;
        const handleDeviceChange = () => {
            // Reescaneo silencioso cuando cambian dispositivos
            scanCameras();
        };

        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        return () => {
            if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
                navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
            }
        };
    }, [scanCameras]);

    return {
        // Estado
        cameras,
        selectedCameraId,
        isLoading,
        error,
        hasCameras,

        // Acciones
        setSelectedCameraId,
        refreshCameras,
        selectCameraByFingerprint,
        getSelectedCamera,
        isSelectedCameraAvailable,
        validateActiveCamera,

        // Utilidades
        scanCameras
    };
}