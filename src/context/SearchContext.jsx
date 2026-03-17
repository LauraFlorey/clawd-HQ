import { createContext, useContext, useRef } from 'react'

/**
 * Context to hold a ref to the KnowledgeSearch component,
 * enabling the global Cmd+K shortcut to focus the search bar
 * from anywhere in the app.
 */
const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const searchRef = useRef(null)
  return (
    <SearchContext.Provider value={searchRef}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchRef() {
  return useContext(SearchContext)
}
