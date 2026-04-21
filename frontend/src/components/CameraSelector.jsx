import React from 'react';

/**
 * Componente para selección de cámaras con nombres persistentes
 */
const CameraSelector = ({
    cameras = [],
    selectedCameraId = '',
    onCameraChange = () => { },
    isLoading = false,
    error = null,
    disabled = false,
    scannerActive = false, // Nueva prop para saber si el scanner está activo
    className = ''
}) => {
    const handleCameraChange = (e) => {
        const newCameraId = e.target.value;
        onCameraChange(newCameraId);
    };

    // El dropdown se deshabilita si está cargando, deshabilitado, o si el scanner está activo
    const isDisabled = disabled || isLoading || scannerActive;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                    Cámara a usar:
                </label>
                {scannerActive && (
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                        Detén la cámara para cambiar
                    </span>
                )}
            </div>

            {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                    {error}
                </div>
            )}

            {cameras.length === 0 && !isLoading && !error && (
                <div className="p-3 text-sm text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                    No se detectaron cámaras
                </div>
            )}

            {cameras.length > 0 && (
                <select
                    value={selectedCameraId}
                    onChange={handleCameraChange}
                    disabled={isDisabled}
                    className="w-full px-3 py-2 text-sm text-white bg-gray-900 border border-gray-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {cameras.map(camera => (
                        <option
                            key={camera.deviceId}
                            value={camera.deviceId}
                            title={`${camera.name} | ${camera.isAvailable ? 'Disponible' : 'No disponible'} | Resolución: ${camera.width}x${camera.height}`}
                        >
                            {camera.name}
                        </option>
                    ))}
                </select>
            )}

            {/* Información de debug en desarrollo */}
            {process.env.NODE_ENV === 'development' && cameras.length > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                    Cámaras detectadas: {cameras.length} |
                    Seleccionada: {cameras.find(c => c.deviceId === selectedCameraId)?.fingerprint || 'Ninguna'}
                </div>
            )}
        </div>
    );
};

export default CameraSelector;