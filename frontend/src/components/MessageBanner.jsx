import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const MessageBanner = ({ message }) => {
    if (!message) return null;
    const ok = message.type === 'success';
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            ok
                ? 'bg-green-500/8 border-green-500/20 text-green-400'
                : 'bg-red-500/8 border-red-500/20 text-red-400'
        }`}>
            {ok
                ? <CheckCircleIcon className="w-5 h-5 shrink-0" />
                : <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
            }
            {message.text}
        </div>
    );
};

export default MessageBanner;