import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ChakraProvider,extendTheme} from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { ThirdwebProvider } from '@thirdweb-dev/react'
import { Sepolia,BinanceTestnet,ArbitrumSepolia} from "@thirdweb-dev/chains";


const theme = extendTheme({
  fonts: {
    heading: `'Ysabeau Office', sans-serif`,
    body: `'Ysabeau Office', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: '#101827', // Default background color
        color: 'white', // Default text color
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
      <ThirdwebProvider supportedChains={[Sepolia,BinanceTestnet,ArbitrumSepolia]} clientId='1dd340fb1746ae8918c5d7d9bb8fbc68'>
        <App />
      </ThirdwebProvider>
      </BrowserRouter>
      </ChakraProvider>
  </React.StrictMode>,
)
