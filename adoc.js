const { BlobReader, BlobWriter, ZipReader } = zip;

/** @type {HTMLInputElement} */
const input = document.getElementById("document");

/** @type {HTMLDivElement} */
const browser = document.getElementById("browser");

let previousZip;

const viewableMimes = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webm: "image/webm",
  txt: "text/plain",
};

const octetStream = "application/octet-stream";

function findMime(filename) {
  if (/\.([A-Za-z0-9]+)$/.test(filename)) {
    const ext = /\.([A-Za-z0-9]+)$/.exec(filename)[1].toLowerCase();
    return viewableMimes[ext] || octetStream;
  }
  return octetStream;
}

async function openDocument() {
  if (input.files.length === 0) return;
  if (previousZip) await previousZip.close();

  const file = input.files.item(0);

  try {
    const fileReader = new BlobReader(file);
    const zipReader = (previousZip = new ZipReader(fileReader));

    const entries = await zipReader.getEntries();

    while (browser.children.length > 0) browser.children.item(0).remove();

    for (const entry of entries.filter((e) => !e.directory)) {
      const itemEl = browser.appendChild(document.createElement("li"));

      itemEl.innerText = entry.filename;
      itemEl.addEventListener("click", async () => {
        const mimeType = findMime(entry.filename);

        const fileWriter = new BlobWriter(mimeType);

        await entry.getData(fileWriter);

        const blob = await fileWriter.getData();
        const url = URL.createObjectURL(blob);

        const linkEl = document.body.appendChild(document.createElement("a"));

        if (mimeType === octetStream) {
          linkEl.setAttribute("download", entry.filename);
        } else {
          linkEl.setAttribute("target", "_blank");
        }

        linkEl.setAttribute("href", url);
        linkEl.click();

        setTimeout(() => URL.revokeObjectURL(url), 5000);
      });
    }

    document.body.classList.add("file-selected");
  } catch (err) {
    console.error("Failed to read zip file", err);

    document.body.classList.remove("file-selected");
    alert(`Failed to open the document!\n\n${err}`);
  }
}
