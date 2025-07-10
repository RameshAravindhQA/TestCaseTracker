import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  defaultColorTheme?: string;
};

// Create context for color theme
type ColorThemeContextType = {
  colorTheme: string;
  setColorTheme: (theme: string) => void;
};

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

// Hook to use the color theme
export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = "system",
  defaultColorTheme = "blue"
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [colorTheme, setColorTheme] = useState(defaultColorTheme);

  // Apply color theme to root element
  useEffect(() => {
    // Remove all existing color themes
    document.documentElement.classList.remove(
      "theme-blue", 
      "theme-purple", 
      "theme-teal", 
      "theme-green", 
      "theme-red", 
      "theme-orange", 
      "theme-pink",
      "theme-indigo",
      "theme-amber"
    );
    
    // Add the current color theme
    document.documentElement.classList.add(`theme-${colorTheme}`);
    
    // Store in local storage
    localStorage.setItem("color-theme", colorTheme);
  }, [colorTheme]);

  // Load color theme from local storage on initial mount
  useEffect(() => {
    const savedColorTheme = localStorage.getItem("color-theme");
    if (savedColorTheme) {
      setColorTheme(savedColorTheme);
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme={defaultTheme} 
        enableSystem 
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </ColorThemeContext.Provider>
  );
}