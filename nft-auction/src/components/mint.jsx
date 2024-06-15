import "./mintStyle.css";
import { useState, useEffect } from "react";
import { useStorageUpload } from "@thirdweb-dev/react";
import axios from "axios";
import 'react-toastify/dist/ReactToastify.css';
import { ethers } from "ethers";
import { Toast } from "@chakra-ui/react";


export default function Mint(){
    const RPC_URL =  import.meta.env.VITE_RPC_URL;
    const contractAddress = import.meta.env.VITE_ADDRESS;

    const mintABI = ['function createToken(string memory _tokenUri,uint256 _supply,uint256 _price)'];


    const [formInput, setFormInput] = useState({
        name:"",
        price:"",
        supply:"",
        coverImageURI:null,
        contentURI:null
      });

    const { mutateAsync: upload } = useStorageUpload();
    //This function uploads the cover image to ipfs and updates the state of cover image field with its uri.
    const coverHandle = async () => {
        const fileInput = document.getElementById('cover');
        const filePath = fileInput.files[0].name;
        const coverCID = await upload({ data: [fileInput.files[0]] });
        console.log(coverCID);
        // if(coverCID){
        //   toast.success("File Uploaded Successfully.", {
        //   position: toast.POSITION.TOP_CENTER
        // });}
        setFormInput({
          ...formInput,
          coverImageURI: `https://ipfs.io/ipfs/${coverCID.toString().split("://")[1]}`
        })
      }
    
      //This function uploads the content to ipfs and updates the state of content field with its uri.
      const contentHandle = async () => {
        const fileInput = document.getElementById('content');
        const filePath = fileInput.files[0].name;
        const contentCID = await upload({ data: [fileInput.files[0]] });
        // if(contentCID){
        //   toast.success("File Uploaded Successfully.", {
        //   position: toast.POSITION.TOP_CENTER
        // });}
        setFormInput({
          ...formInput,
          contentURI: `https://ipfs.io/ipfs/${contentCID.toString().split("://")[1]}`
        })
      }
    
      //This function uploads the metadata of our files and returns it's url.
      const metadata = async () => {
        const {name, price, coverImageURI, contentURI} = formInput;
        if (!name || !price || !coverImageURI || !contentURI) return;
        const data = JSON.stringify({ name, coverImageURI, contentURI });
        const files = [
          new File([data], 'data.json')
        ]
        const metaCID = await upload({ data: [files] });
        const response = await axios({
          method:'get',
          url:`https://ipfs.io/ipfs/${metaCID.toString().split("://")[1]}`
        })
        return response.data[0]
      }

      const publishToken = async(e)=>{

        const providers = new ethers.providers.Web3Provider(window.ethereum);
        const signer = providers.getSigner();
  
        const tokenUri = await metadata();
        
        const contract = new ethers.Contract(
        contractAddress,
        mintABI,
        signer
      )

        //If any input field is empty then a warning toast is fired.
        if(formInput.name === "") {
            toast.warn("Name Field Is Empty", {
                position: toast.POSITION.TOP_CENTER
            });
        } 
        else if(formInput.price === "" ) {
            toast.warn("Price Field Is Empty", {
            position: toast.POSITION.TOP_CENTER
            });
        } 
        else if(formInput.supply === "") {
            toast.warn("Supply Field Is Empty", {
            position: toast.POSITION.TOP_CENTER
            });
        } 
    
        else{
        //Creates new tokens.
        const price = ethers.utils.parseUnits(formInput.price,6);
        const tokenData = await contract.createToken(tokenUri,formInput.supply,price);
        await tokenData.wait()
        .then( () => {
        toast.success("Token Minted Successfully.", {
        position: toast.POSITION.TOP_CENTER
        });
        }).catch( () => {
            toast.error("Failed to mint token.", {
            position: toast.POSITION.TOP_CENTER
            });
        })
         window.location.reload(true);
        }
    }
    return(
        <>
         <div className="container">
            <div className="main">
             
                <div className="publishform">
                <div className="name-div">
                    <p>Name</p>
                <input name="name" onChange={
                    (prop) => setFormInput({
                        ...formInput,
                        name: prop.target.value
                    })
                    } placeholder="Name of the product" required/>
                </div>
            <div className="price-copy-div">
              <div className="price-div">
                <p>Price</p>
                <input name="price" onChange={
                    (prop) => setFormInput({
                      ...formInput,
                      price: prop.target.value
                    })
                  } placeholder="1 MATIC" required/>
              </div>
              <div className="copies-div">
                <p>Copies</p>
                <input name="copies" onChange={
                    (prop) => setFormInput({
                      ...formInput,
                      supply: prop.target.value
                    })
                  } placeholder="1" required/>
              </div>
            </div>
            <div className="Upload">
            <div className="cover-div">
                <p>Cover Image</p>
                <div className="dotted-div">
                  <div className="top">
                    <input className="uploadCover" type="file" id="cover" onChange={coverHandle}/>
                  </div>
                </div>
              </div>
              <div className="content-div">
                <p>Content</p>
                <div className="dotted-div">
                  <div className="top">
                    <input className="uploadContent" type="file" id="content" onChange={contentHandle}/>
                  </div>
                </div>
              </div>
            </div>
            <div className="mbtn">
              <button className="mint" onClick={publishToken}>Mint</button>
            </div>
            </div>
        </div>
        </div>
        </>
    )
}