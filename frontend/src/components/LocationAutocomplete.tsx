import React, { useState, useEffect, useRef } from 'react';
import { useSearchLocationsQuery } from '../redux-slice/pharmaApiSlice';
import type { LocationOption } from './types';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Enter location...',
  label,
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: locationsResponse, isLoading } = useSearchLocationsQuery(
    { query: debouncedTerm },
    { skip: debouncedTerm.length < 3 }
  );

  // Unwrap API response
  const locations = (locationsResponse as any)?.data || [];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(value.length >= 3);
    onChange(value);
  };

  const handleSelectLocation = (location: LocationOption) => {
    const displayName = location.display;
    setSearchTerm(displayName);
    setShowDropdown(false);
    onChange(displayName, {
      lat: location.lat,
      lng: location.lng,
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </label>
      )}
      
      <input
        type="text"
        className="input-field"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() => searchTerm.length >= 3 && setShowDropdown(true)}
      />

      {showDropdown && searchTerm.length >= 3 && (
        <div
          style={{
            position: 'absolute',
            top: label ? 'calc(100% + 0px)' : 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--background)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '4px',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div className="loading-spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
            </div>
          ) : locations.length > 0 ? (
            locations.map((location: LocationOption, index: number) => (
              <div
                key={index}
                onClick={() => handleSelectLocation(location)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: index < locations.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.2s ease',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--background-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '16px', marginTop: '2px' }}>📍</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>
                    {location.display}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '14px',
              }}
            >
              No locations found
            </div>
          )}
        </div>
      )}

      {searchTerm.length > 0 && searchTerm.length < 3 && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '6px',
          }}
        >
          Type at least 3 characters to search
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
