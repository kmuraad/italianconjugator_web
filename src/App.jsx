import { useState } from "react";

//Constants and Globals
const PRONOUSN = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
const AVERE_PRESENT = ["ho", "hai", "ha", "abbiamo", "avete", "hanno"];
const ESSERE_PRESENT = ["sono", "sei", "è", "siamo", "siete", "sono"];

// function cleanText(str){
//     if (str){
//         const pattern = /[\[\]()\d]/g;
//         const stripped = str.replace(pattern, "");
//         return stripped.trim();
//     }
//     else{
//         return "";
//     }
// }

export default function App(){
    const [verb, setVerb] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    function handleInput(event){
        setVerb(event.target.value);
    }

    async function handleSearch(event){
        //This makes sure that a reload isn't necessary, allowing us to be more efficeint with the API call
        event.preventDefault();
        //Gets user input, cleans out white spaces, digits, or capitals.
        const cleanVerb = verb.replace(/[\[\]()\d]/g, '').trim().toLowerCase();
        setLoading(true);
        setError(null);
        setResult(null);

        try{
            const encodedVerb = encodeURIComponent(cleanVerb);
            const endpoint = "https://en.wiktionary.org/w/api.php?action=parse&page=" + encodedVerb + "&prop=text&format=json&origin=*";

            //Fetching the JSON data from the API call
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!data.parse || !data.parse.text){
                setError('"' + cleanVerb + '" is not recognized."');
                setLoading(false);
                return;
            }

            const rawHTML = data.parse.text["*"];
            const parser = new DOMParser();
            const document = parser.parseFromString(rawHTML, "text/html");

            const italianHeading = document.querySelector("h2:has(#Italian), #Italian");
            const italianTable = document.querySelector("table.roa-inflection-table");

            if (italianHeading == null){
                setError(cleanVerb + " has no Italian entry.")
                setLoading(false);
                return;
            }
            else if (italianTable == null){
                setError(cleanVerb + " has no Italian conjugation table.")
                setLoading(false);
                return;
            }
            let aux = null;
            let pastPart = null;
            const tableHeading = document.querySelector("th");
            for (let i = 0; i < tableHeading.length; i++){
                const header = tableHeading[i];
                const headerContent = header.textContent().toLowerCase();
                if (headerContent === "auxiliary verb"){
                    const nextContent = headerContent.nextElementSibling;
                    if (nextContent != null){
                        aux = nextContent.replace(/[\[\]()\d]/g, '').trim().toLowerCase();
                    }
                }
                if (headerContent === "past participle"){
                    const nextContent = headerContent.nextElementSibling;
                    if (nextContent != null){
                        pastPart = nextContent.replace(/[\[\]()\d]/g, '').trim().toLowerCase();
                    }
                }

            }

        }
    }

}