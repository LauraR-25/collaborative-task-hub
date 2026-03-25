import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type HouseThemeName = 'theme-lannister' | 'theme-targaryen' | 'theme-stark';

const themeForPathname = (pathname: string): HouseThemeName => {
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return 'theme-lannister';
  if (pathname.startsWith('/profile')) return 'theme-stark';
  return 'theme-targaryen';
};

const THEME_CLASSES: HouseThemeName[] = ['theme-lannister', 'theme-targaryen', 'theme-stark'];

const HouseTheme = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');

    const nextTheme = themeForPathname(pathname);
    for (const cls of THEME_CLASSES) root.classList.remove(cls);
    root.classList.add(nextTheme);
  }, [pathname]);

  return null;
};

export default HouseTheme;
