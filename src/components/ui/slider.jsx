import * as React from "react"

const Slider = React.forwardRef(({ 
  className, 
  min = 0, 
  max = 100, 
  step = 1, 
  value = [50], 
  onValueChange,
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = React.useState(value[0] || min);

  React.useEffect(() => {
    if (value && value[0] !== undefined) {
      setInternalValue(value[0]);
    }
  }, [value]);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setInternalValue(newValue);
    if (onValueChange) {
      onValueChange([newValue]);
    }
  };

  const percentage = ((internalValue - min) / (max - min)) * 100;

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="relative w-full h-2 bg-[#18221E] border border-[#223029] rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-[#2BA84A] rounded-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onChange={handleChange}
        className="absolute w-full h-2 opacity-0 cursor-pointer"
        {...props}
      />
      <div 
        className="absolute w-5 h-5 bg-[#FFFFFF] border-2 border-[#2BA84A] rounded-full shadow-md pointer-events-none transition-all duration-150"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }