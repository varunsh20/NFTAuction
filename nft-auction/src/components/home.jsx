import axios from "axios";
import { ethers } from "ethers";
import React from 'react';
import { Box, Flex, Grid, List, ListIcon, ListItem, Text,Button,Center,HStack,Input,InputGroup,FormLabel,FormControl,Image} from '@chakra-ui/react';
import {Modal,ModalOverlay,ModalContent,ModalHeader,ModalFooter,ModalBody,ModalCloseButton,useDisclosure} from '@chakra-ui/react'
import { ToastContainer } from 'react-toastify';
import { useState,useEffect } from "react";
import {result} from "./fetchAbi.json";

export default function Home(){

    const [loading,setLoading] = useState(true);
    const [Contents,setContents] = useState([]);
    const [bid, setBidPrice] = useState();
    const initialRef = React.useRef(null)
    const finalRef = React.useRef(null)
    const { isOpen, onOpen, onClose } = useDisclosure()

    const ASSET_ADDRESS = import.meta.env.VITE_ASSET_ADDRESS;
    const RPC_URL =  import.meta.env.VITE_RPC_URL;
    const contractAddress = import.meta.env.VITE_ADDRESS;

    const erc20ABI = [
            'function approve(address spender, uint amount) returns (bool)',
            'function allowance(address owner, address spender) external view returns (uint256)'
    ];
    const OverlayOne = () => (
            <ModalOverlay backdropFilter='blur(10px)'/>
        )
    
    const [overlay, setOverlay] = React.useState(<OverlayOne />)
    
    const handleBidPrice = (event)=>setBidPrice(event.target.value);
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
    const providers = new ethers.providers.Web3Provider(window.ethereum);
    const usdcContract = new ethers.Contract(ASSET_ADDRESS,erc20ABI,providers.getSigner());
    
    useEffect(()=>{

        //This function fetches the list of tokens that are owned by an address.
        async function getStats(){
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const addr = accounts[0];
        const contract = new ethers.Contract(
            contractAddress,
            result,
            provider
        )
        //It returns a list of tokens.
        const myLists = await contract.getActiveAuctions();
        //Fetches all the details of a token.
        console.log(myLists);
        const allData = 
          await Promise.all(myLists.map(async (e)=>{
          const t_uri = await contract.uri(e.tokenId.toString());
          const turi = t_uri.split("/");
          const uri = `https://ipfs.io/ipfs/${turi[2]}/${turi[3]}`;
          const meta = await axios.get(uri);
            return{
                id:e.tokenId.toNumber(),
                startingPrice:ethers.utils.formatUnits(e.startingPrice,6),
                highestBidder:e.highestBidder,
                highestBid:ethers.utils.formatUnits(e.highestBid,6),
                seller:e.seller,
                cover: meta.data.coverImageURI,
                content: meta.data.contentURI,
                name:meta.data.name
            }
          })
        );
        setContents(allData);
        setLoading(false);
      }
      getStats();
      },[])

      console.log(Contents);

      async function submitBid(id){
        const writeContract = new ethers.Contract(contractAddress,result,providers.getSigner());
        const amount = ethers.utils.parseUnits(bid,6);
        const txs = await usdcContract.approve(contractAddress,amount);
        const tx = await contract.placeBid(id,amount);
        await tx.wait();
        
    }
    return(
        <>
        <Flex direction="column" mb={1} mt={18} pl={16}>
             <Flex direction="column" w="100%" mt="100px" pl={10}>
                        <Text fontWeight="bold" fontSize="25px" mb={5} color="white" mt="10px">
                            Available Products
                        </Text>
                    <Grid marginBottom="4" w="100%" direction="row" templateColumns='repeat(4, 1fr)' gap={5}> 
                    {Contents.map((product) => (
                        <Flex w="100%" >
                                <List  h="100%" w="75%" key="low" borderWidth="1px" borderColor={"#253350"}
                                    borderRadius="md" background="#4c689d" padding="6" marginRight="5"
                                    textAlign="left" fontSize="20px" spacing={3} marginBottom="8">
                                    <>
                                    <ListItem>
                                    <Image src={product.cover} alt="product" w={40} height={40}></Image>
                                    </ListItem>
                                        <ListItem color = "white" fontStyle="bold">
                                            Token ID - {product.id}.
                                        </ListItem>
                                        <ListItem color = "white" fontStyle="bold">
                                            Name - {product.name}.
                                        </ListItem>
                                        <ListItem color = "white" fontStyle="bold">
                                            Highest Bidding Price -  {product.highestBid}.
                                        </ListItem>
                                        <ListItem color = "white" fontStyle="bold">
                                            Highest Bidder -  {product.highestBidder}.
                                        </ListItem>
                                        <ListItem color = "white" fontStyle="bold">
                                            NFT Seller -  {product.seller}.
                                        </ListItem>
                                        
                                    </>
                                    <Box display="flex" alignItems = "center" justifyContent="center">
                                         <Button  mt="10px" fontSize="20px" background="#ea6969"
                                         color={"white"} 
                                         _hover={{ bg: "#d43b3b" }}
                                         onClick={() => {setOverlay(<OverlayOne />) 
                                        onOpen()}}>Place Bid</Button>
                                    </Box>
                                </List>
                                <Modal initialFocusRef={initialRef} finalFocusRef={finalRef} 
                                    isOpen={isOpen} onClose={onClose} isCentered size={"xl"} mt="200px">
                                   
                                    {overlay}
                                <ModalContent h={"65%"} bg="rgba(21, 34, 57, 0.6)" border="solid 0.9px #253350"  maxH={"fit-content"}>
                                        <ModalHeader>Place your bid</ModalHeader>
                                    <ModalCloseButton />
                                    <ModalBody >
                                    <FormControl>
                                        <FormLabel fontSize={"22px"}>Place Bid:</FormLabel>
                                            <Input h = {"50px"} ref={initialRef} placeholder='000...' 
                                             bg="rgb(93 132 202 / 60%)" required={true} 
                                             value={bid} onChange={handleBidPrice}/>
                                    </FormControl>
                                    </ModalBody>
                                    <ModalFooter pb="20px">
                                        <Button colorScheme='blue' mr={3} background="#ea6969"
                                         color={"white"} _hover={{ bg: "#d43b3b" }}
                                         onClick={()=>{submitBid(product.id)}}>
                                            Submit
                                        </Button>
                                        <Button onClick={onClose}>Cancel</Button>
                                    </ModalFooter>
                                    </ModalContent>
                                </Modal>
                        </Flex>
                        ))}
                    </Grid>
            </Flex>
            </Flex>
            <ToastContainer/>
        </>
    )
}