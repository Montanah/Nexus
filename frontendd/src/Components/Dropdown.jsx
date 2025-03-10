const Dropdown = ({ options, value, onChange }) => {
    return (
        <select value={value} onChange={onChange}>
            <option value="">Select an option</option>
            {options.map((option, index) => (
                <option key={index} value={option.value}>
                    {option.displayValue}
                </option>
            ))}
        </select>
    );
};

export default Dropdown;
