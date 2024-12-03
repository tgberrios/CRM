// theme.js
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    primary: "#FFFFFF", // Fondo principal
    secondary: "#F7F7F7", // Fondo de secciones
    textPrimary: "#4A4A4A", // Texto principal
    textSecondary: "#7D7D7D", // Texto secundario
    accent: "#9AB79A", // Verde claro para elementos destacados
    hover: "#B9D2B9", // Color de hover
    action: "#52724D", // Color de acción (más oscuro)
  },
  components: {
    Modal: {
      baseStyle: {
        dialog: {
          bg: "white", // El fondo del modal será blanco
          borderRadius: "md", // Bordes suaves
        },
      },
    },
    Table: {
      baseStyle: {
        th: {
          borderBottom: "2px solid", // Solo borde inferior
          borderColor: "gray.200",
        },
        td: {
          borderBottom: "1px solid", // Solo borde inferior
          borderColor: "gray.200",
          background: "transparent", // Fondo transparente por defecto
        },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: "bold", // Botones en negrita
      },
      variants: {
        solid: {
          bg: "accent", // Fondo de botones
          color: "white", // Color del texto
          _hover: {
            bg: "hover", // Color de fondo al hacer hover
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: "textSecondary", // Borde gris inicial
            _hover: {
              borderColor: "accent", // Cambia color al pasar el cursor
            },
            _focus: {
              borderColor: "accent", // Borde verde claro al estar enfocado
              boxShadow: "0 0 0 1px #9AB79A", // Sombra verde claro
            },
          },
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: "primary", // Fondo blanco
        color: "textPrimary", // Texto gris oscuro
      },
    },
  },
});

export default theme;
