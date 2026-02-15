import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

const SelectContext = React.createContext({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {}
})

const Select = ({ children, value, onValueChange, defaultValue }) => {
  const [open, setOpen] = React.useState(false)
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
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ 
      value: internalValue, 
      onValueChange: handleValueChange,
      open,
      setOpen
    }}>
      {children}
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }) => {
  return <div>{children}</div>
}

const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  
  return (
    <span className="block truncate">
      {value || placeholder}
    </span>
  )
}

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-[#223029] bg-[#18221E] px-3 py-2 text-sm text-[#F4F7F5] ring-offset-[#0F1513] placeholder:text-[#7B8A83] focus:outline-none focus:ring-2 focus:ring-[#2BA84A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className={`h-4 w-4 text-[#9EAAA4] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ className, children, position = "popper", ...props }) => {
  const { open, setOpen } = React.useContext(SelectContext)
  const contentRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-[#223029] bg-[#121715] text-[#F4F7F5] shadow-md animate-in fade-in-0 zoom-in-95 ${className}`}
      style={{ marginTop: '4px' }}
      {...props}
    >
      <div className="p-1 max-h-[300px] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
SelectContent.displayName = "SelectContent"

const SelectLabel = ({ className, ...props }) => (
  <div
    className={`py-1.5 pl-8 pr-2 text-sm font-semibold text-[#F4F7F5] ${className}`}
    {...props}
  />
)
SelectLabel.displayName = "SelectLabel"

const SelectItem = ({ className, children, value, ...props }) => {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-[#F4F7F5] outline-none hover:bg-[#18221E] focus:bg-[#18221E] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4 text-[#2BA84A]" />}
      </span>
      {children}
    </div>
  )
}
SelectItem.displayName = "SelectItem"

const SelectSeparator = ({ className, ...props }) => (
  <div
    className={`-mx-1 my-1 h-px bg-[#223029] ${className}`}
    {...props}
  />
)
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}