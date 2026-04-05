import React, { useState } from 'react';
import MarketLineSelector from './components/MarketLineSelector';
import ShelfSelector from './components/ShelfSelector';
import ShelfMap3D from './components/ShelfMap3D';
import {
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const WarehousePage = () => {
  const [selectedMarketLine, setSelectedMarketLine] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [navigationLevel, setNavigationLevel] = useState('market-lines');

  const handleSelectMarketLine = marketLine => {
    setSelectedMarketLine(marketLine);
    setSelectedShelf(null);
    setNavigationLevel('shelves');
  };

  const handleSelectShelf = shelf => {
    setSelectedShelf(shelf);
    setNavigationLevel('map');
  };

  const handleBackToMarketLines = () => {
    setSelectedMarketLine(null);
    setSelectedShelf(null);
    setNavigationLevel('market-lines');
  };

  const handleBackToShelves = () => {
    setSelectedShelf(null);
    setNavigationLevel('shelves');
  };

  // Breadcrumb
  const renderBreadcrumb = () => {
    if (navigationLevel === 'market-lines') return null;

    return (
      <nav className="flex items-center gap-2 text-sm mb-5 animate-fade-in">
        <button
          onClick={handleBackToMarketLines}
          className="text-gray-500 hover:text-handler-red transition-colors font-medium"
        >
          Almacén
        </button>

        {selectedMarketLine && (
          <>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-600" />
            <button
              onClick={navigationLevel === 'map' ? handleBackToShelves : undefined}
              className={`font-medium transition-colors ${
                navigationLevel === 'map' 
                  ? 'text-gray-500 hover:text-handler-red cursor-pointer' 
                  : 'text-gray-200'
              }`}
            >
              {selectedMarketLine.name}
            </button>
          </>
        )}

        {navigationLevel === 'map' && selectedShelf && (
          <>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-gray-200 font-medium">{selectedShelf.name}</span>
          </>
        )}
      </nav>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Module Header - only on market lines view */}
      {navigationLevel === 'market-lines' && (
        <div className="module-header">
          <h2 className="module-title">Almacén</h2>
          <p className="module-subtitle">
            Seleccione una línea de mercado para explorar anaqueles y modelo 3D
          </p>
        </div>
      )}

      {renderBreadcrumb()}

      {navigationLevel === 'market-lines' && (
        <MarketLineSelector onSelectMarketLine={handleSelectMarketLine} />
      )}

      {navigationLevel === 'shelves' && selectedMarketLine && (
        <ShelfSelector
          selectedMarketLine={selectedMarketLine}
          onSelectShelf={handleSelectShelf}
          onBack={handleBackToMarketLines}
        />
      )}

      {navigationLevel === 'map' && selectedShelf && (
        <ShelfMap3D selectedShelf={selectedShelf} onBack={handleBackToShelves} />
      )}
    </div>
  );
};

export default WarehousePage;
