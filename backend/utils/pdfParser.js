import fs from "fs/promises";
import {PDFParse} from "pdf-parse";

/** 
*extract text from pdf file
*@param {string} filePath - path to pdf file
*@returns {Promise<{text:string,numPages:number}>}
 */

export const extractTextFromPDF=async (filePath)=>{
    try{
        const dataBuffer=await fs.readFile(filePath);
        //pdf-parseer expects a Uint8Array, not a buffer
        const parser=new PDFParse(new Uint8Array(dataBuffer));
        const data=await parser.getText();

        return{
            text:data.text,
            numPages:data.numPages,
            info:data.info,
        };
    }catch(error){
        console.error("PDF parsing error:",error);
        throw new Error("Failed to extract text from PDF");
    }
};