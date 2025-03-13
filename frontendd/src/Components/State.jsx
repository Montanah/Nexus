import { Country, State, City } from "country-state-city";
import Dropdown from "./Dropdown";

const CountryStateCityComponent = ({
  selectedCountry,
  setSelectedCountry,
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
}) => {
  const countries = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    displayValue: `${country.name} - ${country.isoCode}`,
  }));

  const states = selectedCountry
    ? State.getStatesOfCountry(selectedCountry).map((state) => ({
        value: state.isoCode,
        displayValue: state.name,
      }))
    : [];

  const cities = selectedCountry && selectedState
    ? City.getCitiesOfState(selectedCountry, selectedState).map((city) => ({
        value: city.name,
        displayValue: city.name,
      }))
    : [];

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full">
        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
          Country
        </label>
        <Dropdown
          options={countries}
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setSelectedState("");
            setSelectedCity("");
          }}
        />
      </div>

      <div className="w-full">
        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
          State
        </label>
        <Dropdown
          options={states}
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedCity("");
          }}
          disabled={!selectedCountry}
        />
      </div>

      <div className="w-full">
        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
          City
        </label>
        <Dropdown
          options={cities}
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          disabled={!selectedState}
        />
      </div>
    </div>
  );
};

export default CountryStateCityComponent;