// Eenmalige curatie: zet de opgehaalde bronmedia (discovery/media-bron) om
// naar geoptimaliseerde bestanden in public/media met leesbare namen, en
// schrijft het herkomstregister (scripts/media-herkomst.json).
// Portretfoto's van teamleden worden bewust NIET overgenomen: de koppeling
// foto-naam is niet verifieerbaar (vaste regel: geen feiten verzinnen).
import sharp from "sharp";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const BRON = "discovery/media-bron/beeld";
const UIT = "public/media";
mkdirSync(UIT, { recursive: true });
mkdirSync(`${UIT}/video`, { recursive: true });
mkdirSync(`${UIT}/logo`, { recursive: true });

// id-fragment -> [doelnaam, breedte, omschrijving]
const beelden = {
  // hero's en grote sfeerbeelden
  "531c4003155d47ec": ["euroveiling-bloemenvloer.webp", 1600, "Euroveiling: interactieve bloemenvloer (Jada Events)"],
  "c1d8d71ce03742f0": ["euroveiling-bloemengang-staand.webp", 1200, "Euroveiling: bloemengang staand"],
  "7b41b1f91c044ab7": ["dreamhack-vloer-breed.webp", 1600, "Werken bij Defensie: interactieve vloer op DreamHack, Ahoy"],
  "5017f4bdf8c4400f": ["panorama-projectie-showroom.webp", 1600, "Panoramische projectie in showroom"],
  "b41b1e23defc4232": ["panorama-kikkerzaal.webp", 1600, "Panoramische projectiezaal met natuurcontent"],
  "61717f8c68fe4f13": ["immersive-kunstzaal.webp", 1600, "Immersive projectiezaal met kunstwerken"],
  "ef60d07b671c4ffd": ["gebouwprojectie-festival.webp", 1600, "Gebouwprojectie bij avond"],
  // producten
  "0494f2c307904bd4": ["alpro-vloer-close.webp", 1200, "Alpro: interactieve vloerprojectie close-up"],
  "12ca03bef7cc48f8": ["hologram-podium-roze.webp", 1200, "Hologrambox op podium (event)"],
  "caf7066e93e645b3": ["hologram-groep-podium.webp", 1200, "Hologram-projectie van personen op podium"],
  "1b00e235510b454a": ["touchscreen-kassa-retail.webp", 1200, "Touchscreen bij retailkassa"],
  "298a0c6f06a643f0": ["outlet-roermond-avondvloer.webp", 1600, "Outlet Roermond: vloerprojectie winkelstraat"],
  "46a7cb579e844457": ["outlet-etalage-beren.webp", 1200, "Outlet Roermond: interactieve etalages"],
  "5b9fc97c85c94f77": ["outlet-etalage-bezoekers.webp", 1200, "Outlet Roermond: bezoekers bij etalage"],
  "4308004da71b45a3": ["starline-stand-scherm.webp", 1600, "Starline: beursstand met projectiescherm"],
  "7bcc476f04e34353": ["starline-zandvloer.webp", 1200, "Starline: interactieve zandvloer"],
  "4c0d98dd69304783": ["muurprojectie-bakkerij.webp", 1200, "Muurprojectie in bakkerscafé"],
  "358f4bc8fe114ec3": ["muurprojectie-groen.webp", 1200, "Interactieve muurprojectie"],
  "540e0a24ad834ab3": ["sketchwall-kinderen-aquarium.webp", 1200, "Sea Life: kinderen bij Sketchwall"],
  "81a32b1069f94ca3": ["sketchwall-kinderen.webp", 1200, "Sea Life: Sketchwall interactie"],
  "692a4080fffa4a5e": ["sketchwall-aquariumwand.webp", 1200, "Sketchwall aquariumwand boven"],
  "541f5bb238a14ec5": ["transparant-scherm-nieuws.webp", 1200, "Transparant scherm met liveinformatie"],
  "91318ce84f0748f3": ["transparant-scherm-product.webp", 1200, "Transparant scherm met product"],
  "5ba5942af6ea4241": ["transparant-toonbank.webp", 1600, "Transparante displaytoonbank"],
  "59ab71c026644616": ["holografische-molen.webp", 1200, "Holografische molen"],
  "99beda2b4bc94d30": ["holografische-molen-schoen.webp", 1200, "Holografische molen met productanimatie"],
  "615f3bd76ead4335": ["symphony-cirkelvloer.webp", 1600, "Circulaire vloerprojectie showroom"],
  "63e8ab1b78ec4ba7": ["led-wand-kas.webp", 1600, "LED-videowall in kassencomplex"],
  "50ab4017c34e4a21": ["led-gevel.webp", 1200, "LED-scherm aan gevel"],
  "66aa14b814cf4610": ["pierson-college-vloer.webp", 1200, "Pierson College: interactieve vloer"],
  "69536857a970404a": ["mm-interactieve-tafel.webp", 1200, "M&M: interactieve tafel"],
  "80671d99c3fd4b75": ["mm-winkel-entree.webp", 1200, "M&M store met interactieve vloer"],
  "6f518ae6872b4fc8": ["holobox-buiten.webp", 1200, "HEREweHOLO holobox buitenopstelling"],
  "6f518ae6872b4fc6": ["holobox-buiten.webp", 1200, "HEREweHOLO holobox buitenopstelling"],
  "7861b5c6e35444e9": ["interactieve-tafel-kaart.webp", 1600, "Interactieve maquettetafel met bezoekers"],
  "ad95ec976cf245db": ["interactieve-tafel-overleg.webp", 1200, "Interactieve tafel tijdens overleg"],
  "9b52baf09ee0454e": ["interactieve-tafel-vissen.webp", 1600, "Grote interactieve tafel met wateranimatie"],
  "d590f34eb5904784": ["clinique-interactieve-bar.webp", 1600, "Clinique: interactieve bar (Bolt Amsterdam)"],
  "911e44dddc94451a": ["virtual-host-lounge.webp", 1200, "Virtual host in ontvangstruimte"],
  "054c1853554d455e": ["virtual-host-buitenunit.webp", 1200, "Virtual host buitenopstelling met scherm"],
  "fd2a9fb5df384943": ["holobox-restaurant.webp", 1200, "Holobox met virtual host in restaurant"],
  "9e5fc355dd7f4ac6": ["tieleman-vloer.webp", 1200, "Tieleman Keukens: interactieve vloer"],
  "0e7f29ee184d4023": ["vloerprojectie-stenen.webp", 1200, "Vloerprojectie rivierstenen"],
  "976be88ccd0d419d": ["vloer-sportteam.webp", 1200, "Interactieve vloer met sportcontent"],
  "be13421ed7784f19": ["vloer-strand.webp", 1200, "Interactieve strandvloer"],
  "d34070ca592d4ed9": ["vloerprojectie-grot.webp", 1200, "Vloerprojectie in bijzondere locatie"],
  "fc147400bb6b4a68": ["vloer-valentijn.webp", 1200, "Vloerprojectie valentijnsactie"],
  "a336cd06b99749ce": ["touchscreen-zuil-beurs.webp", 1200, "Touchscreen-zuil op beurs"],
  "bcf91c6a17ff4c5f": ["beursstand-fotolight.webp", 1200, "Beursstand met interactieve presentatie"],
  "2441036b75e34f5e": ["beursstand-hostess.webp", 1200, "Beursstand met touchopstelling"],
  "b1b9ceb8eac047db": ["studio-content-werkplek.webp", 1200, "Contentstudio: animatiewerkplek"],
  "8db5ed86133f4df0": ["studio-ruimte.webp", 1200, "Studio- en productieruimte"],
  "b007a5145bc345b3": ["nike-gebouw.webp", 1200, "Nike-locatie"],
  "e9145c9a175a46fe": ["timing-etalage-nacht.webp", 1200, "Timing: digitale etalage bij avond"],
  "5b1bb24492574165": ["timing-etalage-schermen.webp", 1200, "Timing: etalageschermen"],
  "e813bbbeff294358": ["shell-etalage-led.webp", 1200, "Shell Technology Centre: LED-informatiescherm"],
  "fca36c91d7dd4014": ["shell-etalage-dag.webp", 1200, "Shell Technology Centre: etalage overdag"],
  "f196ab26da0844a5": ["miele-interactief-raam.webp", 1200, "Miele: interactief raam met touch"],
  "9ebdb6b3ebbe47d7": ["virtual-chef-bord.webp", 1200, "Virtual chef tafelprojectie"],
  "ac82d010fccc414e": ["virtual-chef-couverts.webp", 1200, "Virtual chef: gedekte tafel met projectie"],
  "f635dc97b6ca4bee": ["epson-printer-hologram.webp", 1200, "Epson: producthologram"],
  "134c89414a0f4288": ["hologram-displaykasten.webp", 1200, "Holografische productdisplays"],
  "298a0c6f06a643f1": ["-", 0, ""],
  "05b9ab30aa6a4500": ["alpro-stand-vloer.webp", 1200, "Alpro: standvloer"],
  "2edae3c064e84fd4": ["beursstand-donker.webp", 1200, "Beursstand met vloerprojectie"],
  "0fb33424766a4a85": ["mcarthurglen-logo-blok.webp", 600, "Designer Outlet logo"],
  "8878c2a5264048b1": ["escher-tentoonstelling.webp", 1200, "Immersive projectie kunstruimte"],
};

// logo's voor de klantenbalk (donkere achtergrond)
const logos = {
  "3a623c416ce74eaf": ["jada-events.webp", "Jada Events logo"],
  "3c0a743d9d6540ac": ["rtl.webp", "RTL logo"],
  "90f3e2183ba84ec4": ["mcdonalds.webp", "McDonald's logo"],
  "3870d95b3c1d49fd": ["alpro.webp", "Alpro logo"],
  "c3de19d7d0f04f65": ["sea-life.webp", "Sea Life logo"],
  "4b7082528b9344fc": ["hotel-vic.webp", "Hotel VIC logo"],
  "a5402270ce534c6f": ["escher-museum.webp", "Escher Museum logo"],
  "7c7e90fd8b074d45": ["bloemenbureau-holland.webp", "Bloemenbureau Holland logo"],
  "d215951f1c59479b": ["defensie.webp", "Ministerie van Defensie embleem"],
  "013c2b937f0941fc": ["24-7-events.webp", "24-7 Events logo"],
};

const videos = {
  "87e7bf_33eccef94b504f27b46a76942fc68da6": ["dreamhack-interactieve-vloer", "Werken bij Defensie: interactieve vloer op DreamHack (bronvideo huidige site)"],
  "87e7bf_03d95df2803a4e0784bc5411d3b6610b": ["hologram-displays", "Holografische productdisplays (bronvideo huidige site)"],
};

import { readdirSync } from "node:fs";
const bronbestanden = readdirSync(BRON);
const vind = (frag) => bronbestanden.find((b) => b.includes(frag));

const register = {};
let ok = 0, mis = 0;
for (const [frag, [naam, breedte, omschrijving]] of Object.entries(beelden)) {
  if (naam === "-") continue;
  const bron = vind(frag);
  if (!bron) { console.log(`NIET GEVONDEN: ${frag} (${naam})`); mis++; continue; }
  await sharp(`${BRON}/${bron}`).resize({ width: breedte, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${UIT}/${naam}`);
  register[`/media/${naam}`] = { bron: `wixstatic ${bron.replace(/_mv2.*/, "")}`, omschrijving };
  ok++;
}
for (const [frag, [naam, omschrijving]] of Object.entries(logos)) {
  const bron = vind(frag);
  if (!bron) { console.log(`LOGO NIET GEVONDEN: ${frag}`); mis++; continue; }
  await sharp(`${BRON}/${bron}`).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${UIT}/logo/${naam}`);
  register[`/media/logo/${naam}`] = { bron: `wixstatic ${bron.replace(/_mv2.*/, "")}`, omschrijving };
  ok++;
}
for (const [id, [naam, omschrijving]] of Object.entries(videos)) {
  const bron = `discovery/media-bron/video/${id}-ruw.mp4`;
  if (!existsSync(bron)) { console.log(`VIDEO NIET GEVONDEN: ${id}`); mis++; continue; }
  execSync(`"${ffmpeg}" -y -loglevel error -i ${bron} -vf "scale=1280:-2" -c:v libx264 -crf 25 -preset slow -an -movflags +faststart ${UIT}/video/${naam}.mp4`);
  execSync(`"${ffmpeg}" -y -loglevel error -i ${UIT}/video/${naam}.mp4 -vframes 1 -f image2 ${UIT}/video/${naam}-poster-tmp.png`);
  await sharp(`${UIT}/video/${naam}-poster-tmp.png`).webp({ quality: 75 }).toFile(`${UIT}/video/${naam}-poster.webp`);
  execSync(`rm ${UIT}/video/${naam}-poster-tmp.png`);
  register[`/media/video/${naam}.mp4`] = { bron: `wixstatic video ${id}`, omschrijving };
  ok++;
}

writeFileSync("scripts/media-herkomst.json", JSON.stringify(register, null, 1));
console.log(`curatie: ${ok} bestanden, ${mis} niet gevonden`);
