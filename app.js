const fs = require("fs");
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const arguments = process.argv.slice(2);

// Access specific arguments
if (arguments.length >= 3) {
 console.log("postman summary: ", arguments[0]);
 console.log("input data: ", arguments[1]);
 console.log("output file: ", arguments[2]);
} else {
 console.log("Please provide at least two command-line arguments.");
}

// Your Node.js script (e.g., app.js)

fs.readFile(arguments[0], "utf8", (err, data) => {
 if (err) {
  console.error("Error reading JSON file:", err);
  return;
 }

 const jsonData = JSON.parse(data);

 const allTests = jsonData?.results.map((el) => el?.allTests);

 const testResultFailed = allTests
  .map((el) =>
   el.filter((obj) => Object.values(obj).some((value) => value === false))
  )
  .flat();

 const filteredObject = testResultFailed.map((el) =>
  Object.fromEntries(
   Object.entries(el).filter(([key, value]) => value === false)
  )
 );

 const finalForm = filteredObject.map((el) => Object.keys(el)).flat();

 const rawIndexResults = finalForm.map((el) => {
  const startIndex = el.indexOf("#") + 1;
  return el.slice(startIndex);
 });

 const indexResults = rawIndexResults.sort((a, b) => a - b);

 const finalFormWithErrMsg = finalForm.map((el) => {
  const startIndex = el.indexOf("#") + 1;
  return { id: el.slice(startIndex), errMsg: el.substring(0, startIndex - 3) };
 });

 const sortedFinalFormWithErrMsg = finalFormWithErrMsg.sort(
  (a, b) => a.id - b.id
 );
 //  console.log(sortedFinalFormWithErrMsg);

 let finalResults = [];
 let indexCsvLine = 0;

 const writableStream = fs.createWriteStream(arguments[2]);

 const stringifier = stringify({ header: false });

 //  fs
 //   .createReadStream(arguments[1])
 //   .pipe(parse({ delimiter: ",", from_line: 2 }))
 //   .on("data", function (row) {
 //    if (indexResults.find((el) => el === indexCsvLine.toString())) {
 //     stringifier.write(row);
 //     finalResults.push(row);
 //     indexCsvLine++;
 //    }
 //   })
 //   .on("end", function () {
 //    console.log(finalResults.length);
 //    stringifier.pipe(writableStream);
 //    console.log("Finished");
 //   })
 //   .on("error", function (error) {
 //    console.log(error.message);
 //   });
 fs
  .createReadStream(arguments[1])
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
   if (indexResults.includes(indexCsvLine.toString())) {
    const rowToWrite = [
     ...row,
     sortedFinalFormWithErrMsg.find((el) => el.id == indexCsvLine).errMsg,
    ];
    // stringifier.write(row);
    // finalResults.push(row);
    stringifier.write(rowToWrite);
    finalResults.push(rowToWrite);
   }
   indexCsvLine++;
  })
  .on("end", function () {
   console.log(finalResults.length);
   console.log(indexResults.length);
   console.log(indexCsvLine);
   stringifier.pipe(writableStream);
   console.log("Finished");
  })
  .on("error", function (error) {
   console.log(error.message);
  });
});
