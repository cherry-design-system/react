// Same decision as the inline script a real app puts in <head>.
import { themeInitScript } from "../../src/theme/theme-init";
new Function(themeInitScript)();
