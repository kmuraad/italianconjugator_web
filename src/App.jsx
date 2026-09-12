import {useState} from "react";

//Constants and Globals
const PRONOUNS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
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
    let [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                setError("Error!");
                setLoading(false);
                return;
            }

            const rawHTML = data.parse.text["*"];
            const parser = new DOMParser();
            const parsedDoc = parser.parseFromString(rawHTML, "text/html");

            const italianHeading = parsedDoc.querySelector("h2:has(#Italian), #Italian");
            const italianTable = parsedDoc.querySelector("table.roa-inflection-table");

            if (italianHeading === null){
                setError("Error!")
                setLoading(false);
                return;
            }
            else if (italianTable === null){
                setError("Error!")
                setLoading(false);
                return;
            }
            //***** This segment finds and extracts the auxiliary verb and past participle *****//
            let aux = null;
            let pastPart = null;

            //allHeaders is an array of every th element that was captured from the italianTable parse.
            const allHeaders = Array.from(italianTable.querySelectorAll("th"));
            //Goes through all the elements within allHeaders array to find the th that reads 'auxiliary verb'
            const auxHeader = allHeaders.find((th) => th.textContent.toLowerCase().includes("auxiliary verb"));
            //if both the auxiliary verb exist and the next element to it, then...
            if (auxHeader && auxHeader.nextElementSibling){
                //we've found the auxiliary verb, which is then stored after stripping it of its digits, spaces, and extracurriculars in 'aux'
                aux = auxHeader.nextElementSibling.textContent.replace(/[\[\]()\d]/g, '').trim().toLowerCase();
            }
            const ppHeader = allHeaders.find((th) => th.textContent.toLowerCase().includes("past participle"));
            if (ppHeader && ppHeader.nextElementSibling){
                pastPart = ppHeader.nextElementSibling.textContent.replace(/[\[\]()\d]/g, '').trim().toLowerCase();
            }
            //***** This segment finds and extracts the auxiliary verb and past participle *****//

            const presentConjugation = {};
            const tableRow = italianTable.querySelectorAll("tr");
            for (let i = 0; i < tableRow.length; i++){
                const row = tableRow[i];
                const rowHeader = row.querySelector("th");
                if (rowHeader != null){
                    const rowTitle = rowHeader.textContent.replace(/[\[\]()\d]/g, '').trim().toLowerCase();

                    // ****** This segment isolates the pronouns found in the present tense conjugations
                    if (rowTitle === "present"){
                        const rowData = row.querySelectorAll("td");
                        for (let j = 0; j < PRONOUNS.length; j++){
                            if (j < rowData.length){
                                const currentPronoun = PRONOUNS[j];
                                presentConjugation[currentPronoun] = rowData[j].textContent.replace(/[\[\]()\d]/g, '').trim().toLowerCase();
                            }
                        }
                        break;
                    }
                    // ****** This segment isolates the pronouns found in the present tense conjugations.
                }
            }

            // ****** This segment builds the past tense conjugations ******
            let selectedAuxList = AVERE_PRESENT;
            if (aux != null && aux.includes("ess") || aux.includes("èss")){
                selectedAuxList = ESSERE_PRESENT;
            }
            const pastConjugation = {};
            for (let i = 0; i < PRONOUNS.length; i++){
                const currentPronoun = PRONOUNS[i];
                //aux text looks at the element within each of the pronouns, first run: auxText = Ho
                const auxText = selectedAuxList[i];
                pastConjugation[currentPronoun] = auxText + " " + pastPart;
            }
            // ****** This segment builds the past tense conjugations ******

            setResult({
                present: presentConjugation,
                past: pastConjugation,
            });
        }catch (e) {
            setError("Error! " + e.message);
        }finally{
            setLoading(false);
        }

    }
    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
                <input
                    type="text"
                    value={verb}
                    onChange={handleInput}
                    placeholder="Type of an Italian verb in Italian"
                    style={{ flex: 1, padding: "8px 12px", fontSize: "16px" }}
                />
                <button type="submit" disabled={loading} style={{ padding: "8px 16px", fontSize: "16px", cursor: "pointer" }}>
                    {loading ? "Searching..." : "Conjugate"}
                </button>
            </form>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {result && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
                    {/* Present */}
                    <div>
                        <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>Present</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                            {PRONOUNS.map((pronoun) => (
                                <tr key={pronoun} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "6px 0", color: "#666" }}>{pronoun}</td>
                                    <td style={{ padding: "6px 0", fontWeight: "bold" }}>{result.present[pronoun] || "—"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Future */}
                    <div>
                        <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>Future</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                            {PRONOUNS.map((pronoun) => (
                                <tr key={pronoun} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "6px 0", color: "#666" }}>{pronoun}</td>
                                    <td style={{ padding: "6px 0", fontWeight: "bold" }}>{result.present[pronoun] || "—"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>


                    {/* Past */}
                    <div>
                        <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>Past</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                            {PRONOUNS.map((pronoun) => (
                                <tr key={pronoun} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "6px 0", color: "#666" }}>{pronoun}</td>
                                    <td style={{ padding: "6px 0", fontWeight: "bold" }}>{result.past[pronoun] || "—"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}