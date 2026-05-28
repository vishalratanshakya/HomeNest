import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import { MapPin, Navigation } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LocationSelector({ onChange, initialData = {} }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [detecting, setDetecting] = useState(false);

  // Load initial data if provided
  useEffect(() => {
    if (initialData.country && !selectedCountry) {
      const country = Country.getAllCountries().find(c => c.name === initialData.country);
      if (country) {
        setSelectedCountry({ label: country.name, value: country.isoCode });
        
        if (initialData.state) {
          const state = State.getStatesOfCountry(country.isoCode).find(s => s.name === initialData.state);
          if (state) {
            setSelectedState({ label: state.name, value: state.isoCode });
            
            if (initialData.city) {
              const city = City.getCitiesOfState(country.isoCode, state.isoCode).find(c => c.name === initialData.city);
              if (city) {
                setSelectedCity({ label: city.name, value: city.name });
              }
            }
          }
        }
      }
    }
  }, [initialData]);

  const fallbackIpLocation = async () => {
    try {
      const ipResponse = await axios.get('https://ipapi.co/json/');
      const data = ipResponse.data;
      if (data && data.country_name) {
        const detectedCountryName = data.country_name;
        const detectedStateName = data.region;
        const detectedCityName = data.city;

        // Sync with country-state-city library
        const country = Country.getAllCountries().find(c => c.name === detectedCountryName || c.isoCode === data.country);
        if (country) {
          const countryVal = { label: country.name, value: country.isoCode };
          setSelectedCountry(countryVal);

          const state = State.getStatesOfCountry(country.isoCode).find(s => 
            s.name.toLowerCase().includes(detectedStateName?.toLowerCase()) || 
            detectedStateName?.toLowerCase().includes(s.name.toLowerCase()) ||
            s.isoCode === data.region_code
          );

          if (state) {
            const stateVal = { label: state.name, value: state.isoCode };
            setSelectedState(stateVal);

            const city = City.getCitiesOfState(country.isoCode, state.isoCode).find(c => 
              c.name.toLowerCase() === detectedCityName?.toLowerCase()
            );

            if (city) {
              setSelectedCity({ label: city.name, value: city.name });
            } else if (detectedCityName) {
              setSelectedCity({ label: detectedCityName, value: detectedCityName });
            }
          }
        }
        toast.success('Location detected via IP!');
        return true;
      }
    } catch (err) {
      console.error('IP Geolocation fallback failed:', err);
    }
    return false;
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setDetecting(true);
      fallbackIpLocation().finally(() => setDetecting(false));
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Using Nominatim (Free)
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          const { address } = response.data;
          const detectedCountryName = address.country;
          const detectedStateName = address.state || address.region;
          const detectedCityName = address.city || address.town || address.village || address.suburb;

          // Sync with country-state-city library
          const country = Country.getAllCountries().find(c => c.name === detectedCountryName);
          if (country) {
            const countryVal = { label: country.name, value: country.isoCode };
            setSelectedCountry(countryVal);

            const state = State.getStatesOfCountry(country.isoCode).find(s => 
              s.name.toLowerCase().includes(detectedStateName?.toLowerCase()) || 
              detectedStateName?.toLowerCase().includes(s.name.toLowerCase())
            );

            if (state) {
              const stateVal = { label: state.name, value: state.isoCode };
              setSelectedState(stateVal);

              const city = City.getCitiesOfState(country.isoCode, state.isoCode).find(c => 
                c.name.toLowerCase() === detectedCityName?.toLowerCase()
              );

              if (city) {
                setSelectedCity({ label: city.name, value: city.name });
              } else if (detectedCityName) {
                // Fallback for cities not in the library list
                setSelectedCity({ label: detectedCityName, value: detectedCityName });
              }
            }
          }
          toast.success('Location detected!');
        } catch (error) {
          console.error('Detection error, trying IP fallback:', error);
          const success = await fallbackIpLocation();
          if (!success) {
            toast.error('Failed to detect location');
          }
        } finally {
          setDetecting(false);
        }
      },
      async (error) => {
        console.warn('Geolocation failed, trying IP fallback:', error);
        const success = await fallbackIpLocation();
        setDetecting(false);
        if (!success) {
          toast.error('Permission denied or error getting location');
        }
      }
    );
  };

  // Update parent when selection changes
  useEffect(() => {
    onChange({
      country: selectedCountry?.label || '',
      state: selectedState?.label || '',
      city: selectedCity?.label || ''
    });
  }, [selectedCountry, selectedState, selectedCity]);

  // Options
  const countryOptions = Country.getAllCountries().map(c => ({
    label: c.name,
    value: c.isoCode
  }));

  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map(s => ({
        label: s.name,
        value: s.isoCode
      }))
    : [];

  const cityOptions = (selectedCountry && selectedState)
    ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map(c => ({
        label: c.name,
        value: c.name
      }))
    : [];

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '12px',
      minHeight: '52px',
      padding: '0 8px',
      borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : '#9ca3af'
      },
      transition: 'all 0.2s',
      fontSize: '14px',
      backgroundColor: 'white'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#111827',
      fontWeight: '500'
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      fontWeight: '500',
      backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#4f46e5'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50
    })
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-start sm:justify-end -mb-2">
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors py-2.5 px-4 bg-indigo-50 rounded-xl border border-indigo-100 disabled:opacity-50 uppercase tracking-widest"
        >
          {detecting ? (
            <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <Navigation className="w-3 h-3" />
          )}
          {detecting ? 'Detecting Location...' : 'Use Current Location'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* COUNTRY */}
          <div className="space-y-2">
            <label className="label text-[10px] font-bold uppercase tracking-wider text-gray-500">Country *</label>
            <Select
              options={countryOptions}
              value={selectedCountry}
              styles={customStyles}
              onChange={(val) => {
                setSelectedCountry(val);
                setSelectedState(null);
                setSelectedCity(null);
              }}
              placeholder="Select country"
            />
          </div>

          {/* STATE */}
          <div className="space-y-2">
            <label className="label text-[10px] font-bold uppercase tracking-wider text-gray-500">State *</label>
            <Select
              options={stateOptions}
              value={selectedState}
              styles={customStyles}
              onChange={(val) => {
                setSelectedState(val);
                setSelectedCity(null);
              }}
              placeholder="Select state"
              isDisabled={!selectedCountry}
            />
          </div>
        </div>

        {/* CITY */}
        <div className="space-y-2">
          <label className="label text-[10px] font-bold uppercase tracking-wider text-gray-500">City *</label>
          <Select
            options={cityOptions}
            value={selectedCity}
            styles={customStyles}
            onChange={setSelectedCity}
            placeholder="Select city"
            isDisabled={!selectedState}
          />
        </div>
      </div>
    </div>
  );
}
