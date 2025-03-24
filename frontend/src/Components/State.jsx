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
        <label className="block mb-2 text-blue-600 text-sm sm:text-base">
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
        <label className="block mb-2 text-blue-600 text-sm sm:text-base">
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
        <label className="block mb-2 text-blue-600 text-sm sm:text-base">
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