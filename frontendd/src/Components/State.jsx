import { useState } from "react";
import { Country, State, City } from "country-state-city";
import Dropdown from "./Dropdown";

const CountryStateCityComponent = () => {
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedState, setSelectedState] = useState("");

    // Get all countries
    const countries = Country.getAllCountries().map((country) => ({
        value: country.isoCode, // Store isoCode instead of name
        displayValue: `${country.name} - ${country.isoCode}`,
    }));

    // Get states based on selected country
    const states = selectedCountry
        ? State.getStatesOfCountry(selectedCountry).map((state) => ({
              value: state.isoCode, // Use isoCode to fetch cities later
              displayValue: `${state.name} - ${state.isoCode}`,
          }))
        : [];

    // Get cities based on selected country & state
    const cities = selectedCountry && selectedState
        ? City.getCitiesOfState(selectedCountry, selectedState).map((city) => ({
              value: city.name,
              displayValue: city.name,
          }))
        : [];

    return (
        <div>
            <h2>Select Country</h2>
            <Dropdown
                options={countries}
                value={selectedCountry}
                onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState(""); // Reset state selection when country changes
                }}
            />

            {selectedCountry && (
                <>
                    <h2>Select State</h2>
                    <Dropdown
                        options={states}
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                    />
                </>
            )}

            {selectedCountry && selectedState && cities.length > 0 && (
                <>
                    <h2>Select City</h2>
                    <Dropdown options={cities} />
                </>
            )}
        </div>
    );
};

export default CountryStateCityComponent;
