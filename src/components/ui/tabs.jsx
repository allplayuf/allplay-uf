import * as React from "react"

const TabsContext = React.createContext({
  value: '',
  onValueChange: () => {}
})

const Tabs = ({ children, value, onValueChange, defaultValue, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || value || '')

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  const handleValueChange = (newValue) => {
    setInternalValue(newValue)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  return (
    <TabsContext.Provider value={{ 
      value: internalValue, 
      onValueChange: handleValueChange
    }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-[#18221E] p-1 text-[#B6C2BC] ${className}`}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
  const isSelected = selectedValue === value

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-[#0F1513] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2BA84A] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? 'bg-[#0F1513] text-[#F4F7F5] shadow-sm'
          : 'hover:bg-[#0F1513]/50 hover:text-[#F4F7F5]'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue } = React.useContext(TabsContext)
  
  if (selectedValue !== value) {
    return null
  }

  return (
    <div
      ref={ref}
      className={`mt-2 ring-offset-[#0F1513] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2BA84A] focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }