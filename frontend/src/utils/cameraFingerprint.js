/**
 * UTILIDAD PARA IDENTIFICACIÓN PERSISTENTE DE CÁMARAS
 *
 * Soluciona el problema de deviceId que cambian con reconexiones USB.
 * Crea fingerprints únicos basados en características físicas inmutables.
 */

const FINGERPRINT_CACHE = new Map();

/**
 * Crea un fingerprint único para una cámara basado en características persistentes
 * @param {MediaDeviceInfo} device - Información del dispositivo
 * @param {MediaTrackSettings} settings - Configuración de la pista de video
 * @param {MediaTrackCapabilities} capabilities - Capacidades del dispositivo
 * @returns {string} Fingerprint único de 8 caracteres
 */
export function createCameraFingerprint(device, settings, capabilities) {
    const components = [];

    // 1. GroupId - más persistente que deviceId
    if (device.groupId && device.groupId !== '') {
        components.push(`g:${device.groupId}`);
    }

    // 2. Label OEM si está disponible (muy específico para identificar fabricante)
    if (device.label && isValidLabel(device.label)) {
        components.push(`l:${device.label}`);
    }

    // 4. Capacidades físicas que no cambian
    if (capabilities) {
        // Resolución máxima soportada
        if (capabilities.width?.max) {
            components.push(`w:${capabilities.width.max}`);
        }
        if (capabilities.height?.max) {
            components.push(`h:${capabilities.height.max}`);
        }
        // Frame rate máximo
        if (capabilities.frameRate?.max) {
            components.push(`f:${Math.round(capabilities.frameRate.max)}`);
        }
        // Aspect ratio
        if (capabilities.aspectRatio?.max) {
            components.push(`a:${capabilities.aspectRatio.max.toFixed(2)}`);
        }
    }

    // 5. Facing mode detectado
    if (settings?.facingMode) {
        components.push(`f:${settings.facingMode}`);
    }

    // 6. DeviceId como fallback (menos confiable pero ayuda)
    if (device.deviceId) {
        components.push(`d:${device.deviceId.substring(0, 8)}`);
    }

    // Crear string único y convertir a hash corto
    const fingerprintString = components.join('|');
    return simpleHash(fingerprintString).substring(0, 8);
}

/**
 * Hash simple para crear identificadores cortos
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a 32 bits
    }
    return Math.abs(hash).toString(36);
}

/**
 * Almacena el mapeo entre deviceId actual y fingerprint persistente
 */
export function storeDeviceMapping(deviceId, fingerprint) {
    FINGERPRINT_CACHE.set(deviceId, fingerprint);
}

/**
 * Recupera el fingerprint para un deviceId
 */
export function getStoredFingerprint(deviceId) {
    return FINGERPRINT_CACHE.get(deviceId);
}

/**
 * Busca un dispositivo por su fingerprint en una lista
 */
export function findDeviceByFingerprint(devices, targetFingerprint) {
    return devices.find(device => getStoredFingerprint(device.deviceId) === targetFingerprint);
}

/**
 * Limpia el cache (útil para reinicios)
 */
export function clearFingerprintCache() {
    FINGERPRINT_CACHE.clear();
}

/**
 * Genera nombre descriptivo basado en fingerprint y características
 */
export function generateCameraName(device, settings, capabilities, fingerprint) {
    // Si hay label OEM útil, usarlo
    if (device.label && isValidLabel(device.label)) {
        return `${device.label} [${fingerprint}]`;
    }

    // Construir nombre descriptivo
    const parts = [];

    // Tipo de cámara
    if (settings?.facingMode === 'user') {
        parts.push('Frontal');
    } else if (settings?.facingMode === 'environment') {
        parts.push('Trasera');
    } else {
        parts.push('Cámara');
    }

    // Resolución
    if (settings?.width && settings?.height) {
        parts.push(`${settings.width}x${settings.height}`);
    }

    // Agregar fingerprint para unicidad
    parts.push(`[${fingerprint}]`);

    return parts.join(' ');
}

/**
 * Verifica si un label es válido para usar
 */
function isValidLabel(label) {
    if (!label || label.trim() === '') return false;
    const invalidLabels = ['camera', 'videoinput', 'unknown', 'null', 'undefined'];
    return !invalidLabels.includes(label.toLowerCase().trim());
}