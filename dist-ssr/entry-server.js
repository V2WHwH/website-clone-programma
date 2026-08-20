import { renderToString } from "react-dom/server";
import { Link, NavLink, Route, Routes, StaticRouter, useLocation, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/data/site.ts
var SITE = {
	naam: "Vision2Watch",
	juridischeNaam: "Vision 2 Watch B.V.",
	domein: "https://www.vision2watch.nl",
	oprichtingsjaar: 2008,
	kvk: "27130482",
	btw: "NL009550458B01",
	adres: {
		straat: "Tiber 10",
		postcode: "2491 DH",
		plaats: "Den Haag",
		land: "Nederland"
	},
	telefoon: {
		algemeen: {
			label: "+31 (0)85 007 02 23",
			tel: "+31850070223"
		},
		desmond: {
			label: "+31 (0)6 50 40 95 53",
			tel: "+31650409553",
			naam: "Desmond"
		},
		ronald: {
			label: "+31 (0)6 53 48 62 82",
			tel: "+31653486282",
			naam: "Ronald"
		}
	},
	email: "info@vision2watch.nl",
	socials: [
		{
			naam: "Instagram",
			url: "https://www.instagram.com/vision2watch/"
		},
		{
			naam: "TikTok",
			url: "https://www.tiktok.com/@vision2watch"
		},
		{
			naam: "YouTube",
			url: "https://www.youtube.com/c/vision2watch"
		},
		{
			naam: "LinkedIn",
			url: "https://www.linkedin.com/company/vision2watch"
		}
	]
};
var TEAM = [
	{
		naam: "Desmond",
		rol: "Founder & CEO"
	},
	{
		naam: "Doris",
		rol: "Marketing- en projectmanager"
	},
	{
		naam: "Ronald",
		rol: "Accountmanager"
	},
	{
		naam: "Aline",
		rol: "Projectmanager"
	},
	{
		naam: "Luuk",
		rol: "AV-specialist"
	},
	{
		naam: "Joël",
		rol: "Programmeur"
	},
	{
		naam: "Mark",
		rol: "Animator"
	},
	{
		naam: "Wim",
		rol: "Allrounder"
	},
	{
		naam: "Flo",
		rol: "Hostess"
	},
	{
		naam: "Patricia",
		rol: "Administratie"
	}
];
var KLANTLOGOS = [
	{
		src: "/media/logo/rtl.webp",
		alt: "RTL"
	},
	{
		src: "/media/logo/mcdonalds.webp",
		alt: "McDonald's"
	},
	{
		src: "/media/logo/alpro.webp",
		alt: "Alpro"
	},
	{
		src: "/media/logo/sea-life.webp",
		alt: "Sea Life"
	},
	{
		src: "/media/logo/escher-museum.webp",
		alt: "Escher Museum"
	},
	{
		src: "/media/logo/defensie.webp",
		alt: "Ministerie van Defensie"
	},
	{
		src: "/media/logo/hotel-vic.webp",
		alt: "Hotel VIC Leiden"
	},
	{
		src: "/media/logo/bloemenbureau-holland.webp",
		alt: "Bloemenbureau Holland"
	},
	{
		src: "/media/logo/jada-events.webp",
		alt: "Jada Events"
	}
];
var HOOFDNAV = [
	{
		label: "Producten",
		pad: "/producten"
	},
	{
		label: "Toepassingen",
		pad: "/toepassingen"
	},
	{
		label: "Projecten",
		pad: "/projecten"
	},
	{
		label: "Diensten",
		pad: "/diensten"
	},
	{
		label: "Kennisbank",
		pad: "/kennisbank"
	},
	{
		label: "Over ons",
		pad: "/over-ons"
	}
];
//#endregion
//#region src/components/site/Logo.tsx
function Logo({ className = "" }) {
	return /* @__PURE__ */ jsxs("span", {
		className: `font-display font-semibold tracking-[0.08em] ${className}`,
		translate: "no",
		children: [
			"VISION",
			/* @__PURE__ */ jsx("span", {
				className: "text-accent",
				children: "2"
			}),
			"WATCH"
		]
	});
}
//#endregion
//#region src/components/site/Header.tsx
function Header() {
	const [open, setOpen] = useState(false);
	const locatie = useLocation();
	useEffect(() => setOpen(false), [locatie.pathname]);
	useEffect(() => {
		document.documentElement.style.overflow = open ? "hidden" : "";
		return () => {
			document.documentElement.style.overflow = "";
		};
	}, [open]);
	return /* @__PURE__ */ jsxs("header", {
		className: "sticky top-0 z-40 border-b border-lijn bg-inkt/85 backdrop-blur-md",
		children: [
			/* @__PURE__ */ jsx("a", {
				href: "#inhoud",
				className: "skiplink",
				children: "Naar inhoud"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 md:px-8",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/",
						"aria-label": "Vision2Watch home",
						className: "shrink-0",
						children: /* @__PURE__ */ jsx(Logo, { className: "text-[1.05rem]" })
					}),
					/* @__PURE__ */ jsx("nav", {
						"aria-label": "Hoofdmenu",
						className: "hidden lg:block",
						children: /* @__PURE__ */ jsx("ul", {
							className: "flex items-center gap-7",
							children: HOOFDNAV.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(NavLink, {
								to: item.pad,
								className: ({ isActive }) => `text-[0.92rem] transition-colors duration-200 hover:text-tekst ${isActive ? "text-tekst" : "text-zacht"}`,
								children: item.label
							}) }, item.pad))
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "hidden items-center gap-3 lg:flex",
						children: [/* @__PURE__ */ jsx(Link, {
							to: "/contact",
							className: "rounded-klein border border-lijn px-4 py-2 text-[0.9rem] text-tekst transition-colors hover:border-accent hover:text-accent",
							children: "Contact"
						}), /* @__PURE__ */ jsx(Link, {
							to: "/prijslijst",
							className: "rounded-klein bg-accent px-4 py-2 font-display text-[0.9rem] font-medium text-inkt transition-colors hover:bg-accent-fel",
							children: "Prijslijst aanvragen"
						})]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "flex h-11 w-11 items-center justify-center rounded-klein border border-lijn lg:hidden",
						"aria-expanded": open,
						"aria-controls": "mobiel-menu",
						onClick: () => setOpen(!open),
						children: [/* @__PURE__ */ jsx("span", {
							className: "sr-only",
							children: open ? "Menu sluiten" : "Menu openen"
						}), /* @__PURE__ */ jsx("svg", {
							width: "20",
							height: "20",
							viewBox: "0 0 20 20",
							"aria-hidden": "true",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.6",
							children: open ? /* @__PURE__ */ jsx("path", { d: "M4 4l12 12M16 4L4 16" }) : /* @__PURE__ */ jsx("path", { d: "M2.5 5.5h15M2.5 10h15M2.5 14.5h15" })
						})]
					})
				]
			}),
			open && /* @__PURE__ */ jsx("nav", {
				id: "mobiel-menu",
				"aria-label": "Mobiel menu",
				className: "border-t border-lijn bg-inkt lg:hidden",
				children: /* @__PURE__ */ jsxs("ul", {
					className: "mx-auto max-w-6xl px-5 py-4",
					children: [HOOFDNAV.map((item) => /* @__PURE__ */ jsx("li", {
						className: "border-b border-lijn last:border-0",
						children: /* @__PURE__ */ jsx(NavLink, {
							to: item.pad,
							className: ({ isActive }) => `block py-3.5 text-lg ${isActive ? "text-accent" : "text-tekst"}`,
							children: item.label
						})
					}, item.pad)), /* @__PURE__ */ jsxs("li", {
						className: "flex gap-3 pt-4",
						children: [/* @__PURE__ */ jsx(Link, {
							to: "/contact",
							className: "flex-1 rounded-klein border border-lijn px-4 py-3 text-center",
							children: "Contact"
						}), /* @__PURE__ */ jsx(Link, {
							to: "/prijslijst",
							className: "flex-1 rounded-klein bg-accent px-4 py-3 text-center font-medium text-inkt",
							children: "Prijslijst"
						})]
					})]
				})
			})
		]
	});
}
//#endregion
//#region src/content/nl/producten.ts
var PRODUCTEN = [
	{
		slug: "interactieve-vloer",
		naam: "Interactieve vloer",
		categorie: "interactieve-projectie",
		titel: "Interactieve vloer kopen of huren | Vision2Watch",
		description: "Een vloerprojectie die reageert op elke stap: rimpelend water, spellen of uw huisstijl. Te koop en te huur, met eigen iFloor-software. Bekijk de mogelijkheden.",
		intro: "De interactieve vloer projecteert beelden die direct reageren op de bewegingen van voorbijgangers: rimpelend water onder de voeten, een logo dat meespeelt met elke stap of een compleet voetbalspel. Infraroodcamera's registreren beweging en onze eigen iFloor-software zet die om in vloeiende visuele effecten.",
		waarom: "Op een beurs of in een publieke ruimte heeft u enkele seconden om aandacht te vangen. Een vloer die reageert op wie eroverheen loopt, stopt bezoekers letterlijk in hun loop en maakt van passanten deelnemers. Daarmee wordt de vloer een podium voor uw boodschap in plaats van dode ruimte.",
		beeld: {
			src: "/media/euroveiling-bloemenvloer.webp",
			alt: "Interactieve bloemenvloer van Vision2Watch op het jubileum van Euroveiling"
		},
		video: {
			src: "/media/video/dreamhack-interactieve-vloer.mp4",
			poster: "/media/video/dreamhack-interactieve-vloer-poster.webp",
			label: "Interactieve vloer voor Werken bij Defensie op DreamHack, Ahoy Rotterdam"
		},
		voordelen: [
			{
				kop: "Volledig in uw huisstijl",
				tekst: "Kleuren, stijl, logo's en thema's: elke projectie wordt door onze studio op maat gemaakt, van subtiele merkaccenten tot een compleet spel."
			},
			{
				kop: "Eigen software",
				tekst: "Vision2Watch is een van de weinige partijen in Europa met zelfontwikkelde interactieve software. Aanpassingen en nieuwe content regelen we daardoor snel en in eigen huis."
			},
			{
				kop: "Vast of mobiel",
				tekst: "Als vaste installatie via het plafond, of als draagbaar iFloor-systeem dat in korte tijd staat, ook bij beperkte ruimte en hoogte."
			},
			{
				kop: "Herbruikbaar",
				tekst: "Bij aankoop zet u het systeem zonder extra kosten steeds opnieuw in, met telkens andere content."
			}
		],
		toepassingen: [
			"Beurzen en events",
			"Showrooms",
			"Musea en dierenparken",
			"Onderwijs",
			"Winkels",
			"Hotels en horeca"
		],
		technisch: [
			{
				kop: "Detectie",
				tekst: "Infraroodcamera's registreren beweging nauwkeurig; de gevoeligheid is instelbaar op de lichtintensiteit van de omgeving."
			},
			{
				kop: "Projectie",
				tekst: "Projectoren worden via het plafond of vanaf de zijkant geplaatst en blijven zo buiten beeld. Projectie op gebogen oppervlakken is mogelijk."
			},
			{
				kop: "Mobiele uitvoering",
				tekst: "Samen met Epson ontwikkelden we een mobiele iFloor met compacte behuizing en een groot projectievlak, ideaal voor wisselende locaties."
			},
			{
				kop: "Content",
				tekst: "Maatwerkanimaties en spellen door ons eigen creatieve team, aan te passen per campagne of seizoen."
			}
		],
		levering: "De interactieve vloer is te koop en te huur. Wij adviseren over de juiste opstelling, verzorgen de content, installeren op locatie en blijven beschikbaar voor service, van preventief onderhoud tot een volledige SLA.",
		galerij: [
			{
				src: "/media/dreamhack-vloer-breed.webp",
				alt: "Interactieve gamevloer op DreamHack voor het Ministerie van Defensie"
			},
			{
				src: "/media/vloer-strand.webp",
				alt: "Interactieve strandprojectie op de vloer"
			},
			{
				src: "/media/alpro-stand-vloer.webp",
				alt: "Interactieve vloerprojectie in Alpro-huisstijl"
			},
			{
				src: "/media/ouwehands-stenenvloer.webp",
				alt: "Interactieve waterwereldvloer bij Ouwehands Dierenpark"
			}
		],
		faq: [
			{
				vraag: "Hoe werkt een interactieve vloer?",
				antwoord: "Een projector werpt beeld op de vloer terwijl een infraroodcamera beweging registreert. Onze software vertaalt elke stap direct naar een reactie in de projectie, bijvoorbeeld water dat rimpelt of objecten die wegschuiven."
			},
			{
				vraag: "Kan de vloer in onze eigen huisstijl?",
				antwoord: "Ja. Alle content wordt door onze eigen studio gemaakt: kleuren, logo's, thema's en zelfs complete spellen worden afgestemd op uw merk of campagne."
			},
			{
				vraag: "Werkt de vloer ook in een lichte ruimte?",
				antwoord: "De gevoeligheid van de infraroodcamera's is instelbaar op de lichtintensiteit van de omgeving. Bij de intake kijken we naar uw locatie en adviseren we de juiste opstelling."
			},
			{
				vraag: "Is de interactieve vloer te huren voor één beurs of event?",
				antwoord: "Ja, de vloer is zowel te huur als te koop. Voor eenmalige events is er het mobiele iFloor-systeem dat snel staat; bij aankoop zet u het systeem onbeperkt opnieuw in."
			}
		],
		projecten: [
			"werken-bij-defensie",
			"euroveiling",
			"ouwehands-dierenpark",
			"alpro-interactieve-vloer",
			"rtl",
			"pierson-college"
		],
		verwant: [
			"interactieve-muur",
			"interactieve-tafel",
			"sketchwall"
		]
	},
	{
		slug: "interactieve-muur",
		naam: "Interactieve muur",
		categorie: "interactieve-projectie",
		titel: "Interactieve muur voor events en ruimtes | Vision2Watch",
		description: "Breng een statische muur tot leven: projectie die reageert op beweging, volledig in uw huisstijl. Te koop en te huur voor beurzen, showrooms en publieke ruimtes.",
		intro: "De interactieve muur maakt van een statische wand een levend oppervlak. Sensoren signaleren de bewegingen van passanten en de projectie reageert daar direct op met visuele effecten, van subtiele animaties tot complete spellen.",
		waarom: "Muren zijn vaak de grootste onbenutte vlakken van een ruimte. Door ze interactief te maken verandert een gang, stand of showroom in een ervaring die bezoekers vasthoudt en uw merk letterlijk groot maakt.",
		beeld: {
			src: "/media/muurprojectie-groen.webp",
			alt: "Interactieve muurprojectie die reageert op een passerende bezoeker"
		},
		voordelen: [
			{
				kop: "Entertainment én marketing",
				tekst: "Een krachtige combinatie: bezoekers vermaken zich terwijl uw merk en boodschap het beeld dragen."
			},
			{
				kop: "Content op maat",
				tekst: "Dankzij zelfontwikkelde software passen we de content volledig aan uw huisstijl aan, van logo's tot thematische werelden."
			},
			{
				kop: "Eenvoudig in beheer",
				tekst: "De installatie is eenvoudig, vraagt weinig onderhoud en is door de klant zelf te bedienen."
			},
			{
				kop: "Koop of huur",
				tekst: "Eenmalig inzetten op een event of vast onderdeel van uw ruimte: beide kan, en bij aankoop is het systeem herbruikbaar zonder extra kosten."
			}
		],
		toepassingen: [
			"Beurzen en events",
			"Showrooms",
			"Musea",
			"Kinderomgevingen",
			"Winkels",
			"Horeca"
		],
		technisch: [
			{
				kop: "Detectie",
				tekst: "Bewegingssensoren en infraroodcamera's registreren passanten; de gevoeligheid is instelbaar op de omgeving."
			},
			{
				kop: "Schaalbaar",
				tekst: "Van één wand tot meerdere gekoppelde vlakken; met edge-blending sluiten meerdere projectoren naadloos op elkaar aan."
			},
			{
				kop: "Content",
				tekst: "Animaties, spellen en informatieve content uit onze eigen studio, eenvoudig te wisselen per campagne."
			}
		],
		levering: "Te koop en te huur, inclusief advies over de beste wand en opstelling, contentproductie, installatie en service tot en met een SLA.",
		galerij: [{
			src: "/media/muurprojectie-bakkerij.webp",
			alt: "Muurprojectie met dagverse boodschap in een bakkerscafé"
		}, {
			src: "/media/sketchwall-aquariumwand.webp",
			alt: "Geprojecteerde aquariumwand"
		}],
		faq: [
			{
				vraag: "Wat is het verschil met een videowand?",
				antwoord: "Een videowand toont beeld; een interactieve muur reageert op de mensen ervoor. Bewegingen van passanten sturen de projectie live aan, waardoor bezoekers zelf onderdeel van het beeld worden."
			},
			{
				vraag: "Kan de muur ook tijdelijk, bijvoorbeeld op een beurs?",
				antwoord: "Ja. De interactieve muur is te huur per event en wordt door ons opgebouwd en afgesteld. Voor permanente opstellingen leveren en installeren we een vaste configuratie."
			},
			{
				vraag: "Welke content is mogelijk?",
				antwoord: "Vrijwel alles: merkanimaties, spellen, seizoensthema's of informatieve lagen. Onze studio ontwikkelt de content en kan die per campagne aanpassen."
			}
		],
		projecten: [
			"coffeeshop-marbella",
			"castello",
			"starline",
			"escher-museum"
		],
		verwant: [
			"interactieve-vloer",
			"sketchwall",
			"gebouw-projectie"
		]
	},
	{
		slug: "interactieve-tafel",
		naam: "Interactieve tafel & bar",
		kaartLabel: "Interactieve tafel",
		categorie: "interactieve-projectie",
		titel: "Interactieve tafel en bar | Vision2Watch",
		description: "Elk oppervlak wordt een dynamisch communicatiemiddel: tafels en bars die reageren op aanraking en beweging. Ideaal voor showrooms, beurzen en horeca.",
		intro: "De interactieve tafel of bar verandert elk oppervlak in een dynamisch communicatiemiddel. Het blad reageert op aanraking en beweging: bezoekers bladeren door content, spelen een spel of zien productinformatie verschijnen precies waar ze die verwachten.",
		waarom: "Aan een tafel komen mensen vanzelf samen. Door dat moment interactief te maken, presenteert u producten en verhalen op het moment dat de aandacht er al is, in een showroom, op een stand of aan de bar.",
		beeld: {
			src: "/media/interactieve-tafel-kaart.webp",
			alt: "Interactieve overzichtstafel waar bezoekers samen content bedienen"
		},
		voordelen: [
			{
				kop: "Fysiek en digitaal gecombineerd",
				tekst: "Echte producten op het blad en digitale content eromheen versterken elkaar, zoals bij de interactieve bar voor Clinique waar het oppakken van een flesje de projectie startte."
			},
			{
				kop: "Elk oppervlak",
				tekst: "Van ronde tafel tot lange bar; er kan zelfs op gebogen oppervlakken geprojecteerd worden."
			},
			{
				kop: "Content in uw stijl",
				tekst: "Menu's, productinfo, spellen of sfeeranimaties: onze studio maakt de content op maat en eenvoudig bedienbaar."
			}
		],
		toepassingen: [
			"Showrooms",
			"Beurzen en events",
			"Restaurants en clubs",
			"Productlanceringen",
			"Ontvangstruimtes"
		],
		technisch: [
			{
				kop: "Detectie",
				tekst: "Sensoren en infraroodcamera's registreren aanraking en beweging; de gevoeligheid is aan te passen aan het omgevingslicht."
			},
			{
				kop: "Objectinteractie",
				tekst: "Fysieke producten op het blad kunnen de content aansturen: oppakken of neerzetten start de bijbehorende projectie."
			},
			{
				kop: "Meerdere projectoren",
				tekst: "Voor grote bladen combineren we projectoren met edge-blending tot één naadloos beeld."
			}
		],
		levering: "Te koop en te huur, van eenmalige activatie tot vaste installatie. Vision2Watch verzorgt concept, content, installatie en service.",
		galerij: [
			{
				src: "/media/clinique-interactieve-bar.webp",
				alt: "Interactieve bar in Clinique-stijl met projectie rond de producten"
			},
			{
				src: "/media/mm-interactieve-tafel.webp",
				alt: "Interactieve tafel met kleurrijke animatie"
			},
			{
				src: "/media/interactieve-tafel-overleg.webp",
				alt: "Interactieve tafel tijdens een presentatie"
			}
		],
		faq: [
			{
				vraag: "Reageert de tafel op aanraking of ook op objecten?",
				antwoord: "Beide is mogelijk. Naast aanraking en beweging kan de tafel reageren op fysieke producten: bij de interactieve bar voor Clinique verscheen productinformatie zodra iemand een flesje oppakte."
			},
			{
				vraag: "Is een interactieve bar geschikt voor horeca?",
				antwoord: "Ja, juist daar. Een bar of tafel met interactieve projectie informeert en vermaakt gasten, bijvoorbeeld met een interactieve menukaart of sfeeranimaties die bij de avond passen."
			},
			{
				vraag: "Kan ik de tafel huren voor een productlancering?",
				antwoord: "Ja. We bouwen de opstelling op locatie op, richten de content in op uw campagne en breken na afloop weer af. Kopen kan uiteraard ook."
			}
		],
		projecten: ["clinique", "sea-life"],
		verwant: [
			"virtual-chef",
			"interactieve-vloer",
			"touchscreens"
		]
	},
	{
		slug: "sketchwall",
		naam: "Sketchwall",
		categorie: "interactieve-projectie",
		titel: "Sketchwall: tekeningen komen tot leven | Vision2Watch",
		description: "Kinderen kleuren een tekening, scannen hem in en zien hun creatie levensgroot rondzwemmen op de muur. Een magische interactieve ervaring voor attracties en musea.",
		intro: "Met de Sketchwall komen zelfgemaakte tekeningen tot leven. Bezoekers kleuren een kleurplaat, scannen die in en zien hun creatie direct levensgroot op de muur verschijnen, als vis in een aquarium of auto in een stad. Via een infraroodcamera worden de figuren ook nog interactief: aanraken en ze reageren.",
		waarom: "Niets betrekt kinderen (en hun ouders) zo sterk als iets dat ze zelf hebben gemaakt. De Sketchwall verandert wachten en kijken in meedoen, en geeft locaties een attractie waar bezoekers over blijven praten.",
		beeld: {
			src: "/media/sketchwall-kinderen-aquarium.webp",
			alt: "Kinderen bekijken hun eigen getekende vissen op de Sketchwall bij Sea Life"
		},
		voordelen: [
			{
				kop: "Eigen creatie centraal",
				tekst: "Elke bezoeker ziet zijn eigen tekening tot leven komen; geen twee bezoeken zijn hetzelfde."
			},
			{
				kop: "Interactief",
				tekst: "Figuren reageren op aanraking: vissen schrikken, auto's toeteren. De infraroodcamera maakt de wand zelf een speelvlak."
			},
			{
				kop: "Elk thema",
				tekst: "Aquarium, stad, ruimte of uw eigen merkwereld: kleurplaten en decor worden op maat ontworpen."
			}
		],
		toepassingen: [
			"Attracties en dierenparken",
			"Musea",
			"Kinderafdelingen",
			"Events",
			"Winkelcentra"
		],
		technisch: [
			{
				kop: "Scanproces",
				tekst: "Kleurplaten worden ingescand en verschijnen binnen enkele ogenblikken geanimeerd in de projectie."
			},
			{
				kop: "Interactie",
				tekst: "Een infraroodcamera registreert aanrakingen van de wand en laat de figuren reageren."
			},
			{
				kop: "Contentbeheer",
				tekst: "Thema's en kleurplaten zijn te wisselen per seizoen of campagne; onze studio levert de animaties."
			}
		],
		levering: "De Sketchwall leveren we als complete opstelling: scanner, projectie, software en op maat gemaakte kleurplaten. Te koop en te huur, met installatie en service door ons team.",
		galerij: [{
			src: "/media/sketchwall-kinderen.webp",
			alt: "Kinderen spelen met hun getekende vissen op de interactieve wand"
		}, {
			src: "/media/sketchwall-aquariumwand.webp",
			alt: "Aquariumprojectie van de Sketchwall"
		}],
		faq: [
			{
				vraag: "Voor welke leeftijd is de Sketchwall geschikt?",
				antwoord: "Het kleuren en scannen is voor alle leeftijden; vooral kinderen in de basisschoolleeftijd blijven lang spelen. Volwassenen doen in de praktijk net zo enthousiast mee."
			},
			{
				vraag: "Kunnen de kleurplaten in ons eigen thema?",
				antwoord: "Ja. Onze studio ontwerpt kleurplaten en decor in elk gewenst thema, van uw merkwereld tot een seizoenscampagne."
			},
			{
				vraag: "Is de Sketchwall permanent te installeren?",
				antwoord: "Ja. Bij Sea Life draait de Sketchwall als vaste attractie naast een permanente interactieve vloer. Tijdelijke huur voor een event kan ook."
			}
		],
		projecten: ["sea-life"],
		verwant: ["interactieve-muur", "interactieve-vloer"]
	},
	{
		slug: "virtual-chef",
		naam: "Virtual Chef",
		categorie: "interactieve-projectie",
		titel: "Virtual Chef: tafelprojectie voor restaurants | Vision2Watch",
		description: "Een mini-chef bereidt het gerecht op tafel terwijl gasten wachten: 3D-tafelprojectie die van een diner een belevenis maakt. Bekend van concepten als Le Petit Chef.",
		intro: "Met de Virtual Chef verschijnt via 3D-mapping een mini-chef op tafel die op speelse wijze het gerecht bereidt. Gasten worden meegenomen in een visueel verhaal terwijl ze op hun eten wachten: verwondering en vermaak aan tafel, bekend van concepten als Le Petit Chef en Dinner in Motion.",
		waarom: "Uit eten gaan is beleving. De Virtual Chef maakt van de wachttijd het hoogtepunt van de avond en geeft restaurants een verhaal dat gasten delen, aan tafel en online.",
		beeld: {
			src: "/media/virtual-chef-tafelrond.webp",
			alt: "Gedekte tafel met Virtual Chef-projectie rond de borden"
		},
		voordelen: [
			{
				kop: "Wachten wordt beleving",
				tekst: "De mini-chef bereidt gerechten die aansluiten op het menu; het verhaal eindigt precies waar het echte bord verschijnt."
			},
			{
				kop: "Geen brillen of schermen",
				tekst: "De ervaring werkt met projectie op de gedekte tafel zelf, direct en realistisch, zonder AR-brillen."
			},
			{
				kop: "De hele ruimte doet mee",
				tekst: "Aanvullende projecties op muren en tafels stemmen de sfeer van het restaurant af op het thema van de avond."
			}
		],
		toepassingen: [
			"Restaurants",
			"Hotels",
			"Private dining en events",
			"Productpresentaties food"
		],
		technisch: [
			{
				kop: "3D-mapping",
				tekst: "Nauwkeurige projectie sluit aan op de objecten op tafel: borden, bestek en glazen worden onderdeel van de animatie."
			},
			{
				kop: "Maatwerkanimaties",
				tekst: "Bestaande shows of volledig eigen verhalen, afgestemd op menu en huisstijl."
			},
			{
				kop: "Sfeerprojectie",
				tekst: "Optionele muur- en tafelprojecties transformeren de hele zaal per gang of thema."
			}
		],
		levering: "Vision2Watch levert de complete opstelling met projectie, software en content, inclusief installatie en instructie voor het personeel. Te koop en te huur voor vaste concepten of speciale avonden.",
		faq: [
			{
				vraag: "Werkt de Virtual Chef op onze bestaande tafels?",
				antwoord: "In de meeste gevallen wel. De projectie wordt gemapt op de tafelopstelling; bij de intake kijken we naar tafelmaat, kleur en lichtomstandigheden in de zaal."
			},
			{
				vraag: "Kunnen we een eigen verhaal laten maken?",
				antwoord: "Ja. Naast bestaande shows ontwikkelt onze studio animaties op maat, afgestemd op uw menu, huisstijl of het thema van de avond."
			},
			{
				vraag: "Is dit alleen voor restaurants?",
				antwoord: "Nee. De techniek werkt overal waar aan tafel iets te presenteren valt: private dining, hotelarrangementen of productpresentaties in de foodbranche."
			}
		],
		projecten: ["clinique"],
		verwant: ["interactieve-tafel", "panoramische-projectie"]
	},
	{
		slug: "hologram-projectie",
		naam: "Hologram-projectie",
		categorie: "holografie",
		titel: "Hologram-projectie op ware grootte | Vision2Watch",
		description: "Personen en producten levensgroot als zwevend hologram, gebaseerd op het Pepper's Ghost-principe. Te koop en te huur voor retail, beurzen en podia.",
		intro: "Bij hologram-projectie worden personen, producten of objecten op ware grootte geprojecteerd op een speciaal transparant scherm. Door de gebruikte techniek lijkt het beeld vrij in de ruimte te zweven: een opvallend hologram-effect voor retail, architectuur, beurzen en podia.",
		waarom: "Een spreker die verschijnt zonder aanwezig te zijn, een product dat zwevend in de ruimte draait: een hologram trekt aandacht op een manier die een gewoon scherm niet kan. In onze showroom staat een holografisch scherm van 9 meter, het langste van Nederland, om het effect zelf te ervaren.",
		beeld: {
			src: "/media/hologram-groep-podium.webp",
			alt: "Levensgrote hologram-projectie van personen op een podium"
		},
		video: {
			src: "/media/video/hologram-displays.mp4",
			poster: "/media/video/hologram-displays-poster.webp",
			label: "Holografische productdisplays in bedrijf"
		},
		voordelen: [
			{
				kop: "Levensgroot en levensecht",
				tekst: "Personen en producten verschijnen op ware grootte, met hoge resolutie en een overtuigend zwevend effect."
			},
			{
				kop: "Beproefde techniek",
				tekst: "Gebaseerd op het Pepper's Ghost-principe dat al meer dan 150 jaar in theater en attracties wordt gebruikt, uitgevoerd met stabiele moderne software en hardware."
			},
			{
				kop: "Ook interactief",
				tekst: "Leverbaar met touchbediening, bijvoorbeeld voor 360-gradenpresentaties van producten."
			},
			{
				kop: "Koop of huur",
				tekst: "Voor een eenmalige show of als vaste blikvanger; bij aankoop herbruikbaar zonder extra kosten."
			}
		],
		toepassingen: [
			"Beurzen en congressen",
			"Retail en etalages",
			"Podia en theater",
			"Productlanceringen",
			"Showrooms"
		],
		technisch: [
			{
				kop: "Pepper's Ghost",
				tekst: "Een transparante folie en verborgen projectoren (vaak onder de vloer) creëren de illusie dat er werkelijk iemand of iets staat."
			},
			{
				kop: "Formaten",
				tekst: "Beschikbaar in diverse afmetingen, van productdisplay tot podiumbreed; met standaard- of maatwerksoftware."
			},
			{
				kop: "Installatie",
				tekst: "Eenvoudig te installeren en onderhoudsarm; wij verzorgen de volledige afstelling op locatie."
			}
		],
		levering: "Vision2Watch levert hologram-projectie als totaaloplossing: scherm, projectie, software en de holografische content uit eigen studio. Te koop en te huur; de prijs hangt af van formaat en project.",
		galerij: [{
			src: "/media/epson-printer-hologram.webp",
			alt: "Producthologram van een printer"
		}, {
			src: "/media/hologram-podium-roze.webp",
			alt: "Hologrampresentatie tijdens een tv-productie"
		}],
		faq: [
			{
				vraag: "Wat is Pepper's Ghost?",
				antwoord: "Een illusietechniek die al meer dan 150 jaar bestaat: via een transparante folie en verborgen projectoren lijkt een persoon of object echt in de ruimte te staan. Dezelfde techniek bracht artiesten als Tupac en Elvis holografisch terug op het podium."
			},
			{
				vraag: "Kan een spreker live als hologram verschijnen?",
				antwoord: "Ja, zowel opgenomen als live weergave van personen op ware grootte is mogelijk. Zo verschijnt een spreker of artiest op locaties waar die fysiek niet aanwezig is."
			},
			{
				vraag: "Kan ik het effect eerst zien?",
				antwoord: "Graag zelfs. In onze showroom staat een 9 meter lang holografisch scherm, het langste van Nederland. Maak een afspraak en ervaar het effect in het echt."
			}
		],
		projecten: ["escher-museum"],
		verwant: [
			"hereweholo",
			"holografische-molen",
			"virtual-host"
		]
	},
	{
		slug: "holografische-molen",
		naam: "Holografische molen",
		categorie: "holografie",
		titel: "Holografische molen: 3D-beelden in de lucht | Vision2Watch",
		description: "LED-molens die haarscherpe 3D-beelden in de ruimte laten zweven, zelfs bij daglicht. Koppelbaar tot een holomuur. Te koop en te huur.",
		intro: "De holografische molen projecteert haarscherpe 2D- en 3D-beelden die letterlijk in de lucht lijken te hangen, zonder scherm. Dankzij krachtige LED-technologie blijven de beelden helder zichtbaar, zelfs bij daglicht.",
		waarom: "Op plekken waar elke vierkante meter telt, zoals een etalage, beurs of winkelvloer, zet een zwevend beeld uw product of logo in de ruimte zonder iets te bouwen. Meerdere molens gekoppeld vormen een holomuur voor grote projecties met maximale impact.",
		beeld: {
			src: "/media/holografische-molen-schoen.webp",
			alt: "Holografische molen projecteert een zwevende sportschoen"
		},
		voordelen: [
			{
				kop: "Geen scherm nodig",
				tekst: "Het beeld zweeft vrij in de ruimte en trekt daardoor automatisch de blik."
			},
			{
				kop: "Daglichtbestendig",
				tekst: "Scherpe, heldere projecties door krachtige LED's, ook in een lichte winkel of etalage."
			},
			{
				kop: "Uitbreidbaar tot holomuur",
				tekst: "Meerdere molens worden gekoppeld tot één groot beeld, met minimale zichtbaarheid van de kaders voor een sterker holografisch effect."
			},
			{
				kop: "Maten en kleuren",
				tekst: "Verkrijgbaar in verschillende formaten en uitvoeringen, voor verkoop en verhuur."
			}
		],
		toepassingen: [
			"Etalages",
			"Beurzen",
			"Winkels",
			"Showrooms",
			"Presentaties"
		],
		technisch: [
			{
				kop: "Weergave",
				tekst: "2D- en 3D-hologrammen met vloeiende, heldere beelden door LED-technologie."
			},
			{
				kop: "Content",
				tekst: "Maatwerkanimaties van uw product of logo door ons eigen creatieve team."
			},
			{
				kop: "Koppeling",
				tekst: "Meerdere molens synchroon geschakeld vormen een holomuur voor grotere projecties."
			}
		],
		levering: "Te koop en te huur, inclusief content op maat, montage en instructie. Voor campagnes leveren we complete sets met beheer op afstand van de content.",
		faq: [
			{
				vraag: "Is een holografische molen ook overdag goed zichtbaar?",
				antwoord: "Ja. De molens gebruiken krachtige LED's waardoor de beelden ook bij sterk daglicht scherp en helder blijven, bijvoorbeeld in een etalage."
			},
			{
				vraag: "Wat is een holomuur?",
				antwoord: "Meerdere gekoppelde holografische molens die samen één groot zwevend beeld vormen. Door de minimale zichtbaarheid van de kaders ontstaat een sterk holografisch effect op groot formaat."
			},
			{
				vraag: "Kan mijn eigen product als hologram getoond worden?",
				antwoord: "Ja. Onze studio maakt een 3D-animatie van uw product of logo, precies afgestemd op de molen en uw campagne."
			}
		],
		projecten: [],
		verwant: [
			"hologram-projectie",
			"hereweholo",
			"led-displays"
		]
	},
	{
		slug: "hereweholo",
		naam: "Holobox (HEREweHOLO)",
		kaartLabel: "Holobox",
		categorie: "holografie",
		titel: "Holobox kopen of huren: HEREweHOLO | Vision2Watch",
		description: "De holobox van zusterbedrijf HEREweHOLO toont personen en producten als levensgroot hologram in een plug-and-play display. Ook als compacte Holomini.",
		intro: "De holobox is een plug-and-play holografisch display waarin personen en producten levensecht lijken te zweven. Het is het paradepaardje van HEREweHOLO, het zusterbedrijf van Vision2Watch dat volledig in holografische oplossingen is gespecialiseerd.",
		waarom: "Een holobox combineert de impact van een hologram met het gemak van een kant-en-klaar product: neerzetten, aansluiten en uw presentator, product of boodschap staat er, 24 uur per dag. De compacte Holomini doet hetzelfde op balie- en etalageformaat.",
		beeld: {
			src: "/media/holobox-buiten.webp",
			alt: "HEREweHOLO holobox met levensgroot hologram in het veld"
		},
		voordelen: [
			{
				kop: "Plug-and-play",
				tekst: "Complete unit met display, verlichting en geluid; geen bouwwerk op locatie nodig."
			},
			{
				kop: "Brandbaar",
				tekst: "De box wordt uitgevoerd in uw logo en kleuren, zodat het display zelf al uw merk draagt."
			},
			{
				kop: "Levensgroot of mini",
				tekst: "Van levensgrote presentator tot Holomini voor producten op de balie of in de etalage."
			},
			{
				kop: "Specialistisch team",
				tekst: "HEREweHOLO ontwikkelt content, koppelingen en zelfs hologramwanden van meerdere boxen."
			}
		],
		toepassingen: [
			"Beurzen",
			"Retail",
			"Ontvangstruimtes",
			"Events en congressen",
			"Horeca"
		],
		technisch: [
			{
				kop: "Weergave",
				tekst: "Transparant display met verlichte binnenruimte; fysieke producten kunnen worden gecombineerd met een holografische wereld eromheen."
			},
			{
				kop: "Content",
				tekst: "Opgenomen presentaties, productanimaties of live weergave; contentproductie in eigen huis."
			},
			{
				kop: "Koppelbaar",
				tekst: "Meerdere boxen vormen samen een hologramwand voor grotere opstellingen."
			}
		],
		levering: "Holoboxen zijn te koop en te huur via Vision2Watch en HEREweHOLO, inclusief content, bezorging en installatie. Kijk voor het volledige holografische assortiment op hereweholo.nl.",
		galerij: [{
			src: "/media/holobox-restaurant.webp",
			alt: "Holobox met virtuele presentator in een restaurant"
		}],
		faq: [
			{
				vraag: "Wat is het verschil tussen de holobox en hologram-projectie?",
				antwoord: "De holobox is een kant-en-klaar, verplaatsbaar display; hologram-projectie is een maatwerkinstallatie met transparant scherm die we op locatie bouwen, tot podiumformaat aan toe."
			},
			{
				vraag: "Wat is HEREweHOLO?",
				antwoord: "HEREweHOLO is het zusterbedrijf van Vision2Watch, volledig gespecialiseerd in holografische oplossingen zoals de holobox, de Holomini en hologramwanden. Beide teams werken nauw samen."
			},
			{
				vraag: "Kan er een echt product in de holobox?",
				antwoord: "Ja. Een fysiek product in de box wordt uitgelicht en aangevuld met een holografische wereld eromheen, bijvoorbeeld zwevende specificaties of animaties."
			}
		],
		projecten: [],
		verwant: [
			"hologram-projectie",
			"holografische-molen",
			"virtual-host"
		]
	},
	{
		slug: "virtual-host",
		naam: "Virtual Host",
		categorie: "holografie",
		titel: "Virtual Host: virtuele gastvrouw of gastheer | Vision2Watch",
		description: "Een levensechte geprojecteerde host die passanten automatisch aanspreekt zodra ze naderen. Volledig op maat, 24 uur per dag inzetbaar. Te koop en te huur.",
		intro: "De Virtual Host(ess) is een levensechte projectie van een persoon die voorbijgangers direct aanspreekt en informeert zodra ze in de buurt komen. Slimme bewegingssensoren activeren de presentatie automatisch, waardoor uw stand of entree letterlijk tot leven komt.",
		waarom: "Een goede host is er altijd, kent het verhaal perfect en wordt nooit moe. De Virtual Host communiceert 24 uur per dag zonder pauze en geeft elke bezoeker dezelfde sterke eerste indruk, op een beurs, in een winkel of bij de receptie.",
		beeld: {
			src: "/media/virtual-host-lounge.webp",
			alt: "Virtual host verwelkomt bezoekers in een ontvangstruimte"
		},
		voordelen: [
			{
				kop: "Spreekt vanzelf aan",
				tekst: "Bewegingssensoren starten de presentatie zodra iemand nadert; niemand loopt ongemerkt voorbij."
			},
			{
				kop: "Volledig op maat",
				tekst: "Model, kleding, tekst, toon en animatie worden afgestemd op uw merk en boodschap."
			},
			{
				kop: "Elk formaat",
				tekst: "Levensgroot bij de entree of als miniatuur op de balie, met of zonder touchscreen."
			},
			{
				kop: "Altijd inzetbaar",
				tekst: "24 uur per dag actief; bij aankoop steeds opnieuw te gebruiken met nieuwe content."
			}
		],
		toepassingen: [
			"Beurzen",
			"Winkels",
			"Ontvangstruimtes en recepties",
			"Events",
			"Publieksinformatie"
		],
		technisch: [
			{
				kop: "Detectie",
				tekst: "Bewegings- en spraaksensoren zorgen dat de host reageert op wie er voor staat."
			},
			{
				kop: "Productie",
				tekst: "Video-opname van een echte presentator gecombineerd met animaties, logo's en unieke visuals."
			},
			{
				kop: "AI-integratie",
				tekst: "Optioneel met dynamische reacties en intelligente interacties voor een gesprek in plaats van een monoloog."
			},
			{
				kop: "Varianten",
				tekst: "Ook leverbaar als Virtual Product Presenter die producten toelicht, zoals ontwikkeld voor Epson."
			}
		],
		levering: "Van scriptontwikkeling en opname tot installatie op locatie: Vision2Watch levert de complete virtuele host, te koop en te huur.",
		galerij: [{
			src: "/media/virtual-host-buitenunit.webp",
			alt: "Virtual host in een buitenopstelling met informatiescherm"
		}, {
			src: "/media/virtual-host-silhouet.webp",
			alt: "Virtual host spreekt passanten aan"
		}],
		faq: [
			{
				vraag: "Hoe wordt de Virtual Host gemaakt?",
				antwoord: "We nemen een echte presentator op video op en combineren die met animaties en uw huisstijl. Het resultaat wordt levensecht geprojecteerd en start automatisch bij detectie van een passant."
			},
			{
				vraag: "Kan de host vragen beantwoorden?",
				antwoord: "Naast vaste presentaties is AI-integratie mogelijk voor dynamische reacties en intelligente interacties, eventueel gecombineerd met een touchscreen voor zelfbediening."
			},
			{
				vraag: "Welke formaten zijn er?",
				antwoord: "Van levensgrote projectie tot compacte miniatuur op de balie of in een holobox; met of zonder touchfunctionaliteit, te koop en te huur."
			}
		],
		projecten: [],
		verwant: [
			"hereweholo",
			"hologram-projectie",
			"touchscreens"
		]
	},
	{
		slug: "touchscreens",
		naam: "Touchscreens",
		categorie: "schermen-en-displays",
		titel: "Touchscreens en touchtafels | Vision2Watch",
		description: "Multi-touch schermen, tafels en zuilen in alle formaten, geleverd als totaaloplossing met content en installatie. Voor showrooms, beurzen en publieksruimtes.",
		intro: "Vision2Watch levert een breed aanbod interactieve touchscreens: van multi-touch schermen en touchtafels tot informatiezuilen. Altijd als totaaloplossing, met de juiste hardware, op maat gemaakte content en een gebruikerservaring die klopt.",
		waarom: "Een touchscreen is pas waardevol met de juiste inhoud. Daarom leveren we niet alleen het scherm, maar ook de interactieve presentaties, catalogi en bediening die bezoekers echt gebruiken, afgestemd op uw merk en doel.",
		beeld: {
			src: "/media/touchscreen-zuil-beurs.webp",
			alt: "Touchscreen-informatiezuil op een beurs"
		},
		voordelen: [
			{
				kop: "Totaaloplossing",
				tekst: "Scherm, computer, montage en content uit één hand; direct klaar voor gebruik."
			},
			{
				kop: "Alle formaten",
				tekst: "Van compacte schermen tot grote touchtafels met LCD en geluid, staand, liggend of als zuil."
			},
			{
				kop: "Multi-touch",
				tekst: "Schrijven, tekenen, bladeren en presenteren met vingers of stylus, ook met meerdere gebruikers tegelijk."
			}
		],
		toepassingen: [
			"Showrooms",
			"Beurzen",
			"Ontvangstruimtes",
			"Retail",
			"Presentaties en educatie"
		],
		technisch: [
			{
				kop: "Hardware",
				tekst: "Touchscreens in diverse afmetingen met geïntegreerde computersystemen, als losse schermen, tafels of zuilen."
			},
			{
				kop: "Content",
				tekst: "Interactieve presentaties van campagnes, brochures en media in gangbare formaten, gebouwd door onze eigen studio."
			},
			{
				kop: "Beheer",
				tekst: "Content is eenvoudig te wisselen; wij ondersteunen bij beheer en updates."
			}
		],
		levering: "Touchscreens leveren we als koopoplossing, inclusief advies, installatie en content. Voor tijdelijke inzet denken we mee over de best passende oplossing per event.",
		galerij: [{
			src: "/media/touchscreen-kassa-retail.webp",
			alt: "Touchscreen naast de kassa in een winkel"
		}, {
			src: "/media/beursstand-hostess.webp",
			alt: "Touchopstelling op een beursstand"
		}],
		faq: [
			{
				vraag: "Levert Vision2Watch ook de content voor het scherm?",
				antwoord: "Ja, juist dat. Onze studio bouwt de interactieve presentaties, productcatalogi en spellen die het scherm de moeite waard maken, volledig in uw huisstijl."
			},
			{
				vraag: "Welke formaten en uitvoeringen zijn er?",
				antwoord: "Van compacte schermen tot grote multi-touch tafels en informatiezuilen, met bediening per vinger of stylus en waar gewenst geluid."
			},
			{
				vraag: "Zijn touchscreens ook te huren?",
				antwoord: "Touchscreens leveren we primair als koopoplossing. Voor eenmalige events adviseren we per situatie de best passende opstelling; neem daarvoor contact op."
			}
		],
		projecten: ["starline"],
		verwant: [
			"interactieve-tafel",
			"interactieve-etalage",
			"transparant-scherm"
		]
	},
	{
		slug: "interactieve-etalage",
		naam: "Interactieve etalage",
		categorie: "schermen-en-displays",
		titel: "Interactieve etalage met touch foil | Vision2Watch",
		description: "Maak van uw etalageruit een interactief medium dat 24/7 met passanten communiceert: touch door het glas, bewegingsdetectie en content op maat.",
		intro: "De interactieve etalage maakt van een winkelruit een medium dat 24 uur per dag met passanten communiceert. Een vrijwel onzichtbare touch foil aan de binnenzijde van het glas maakt de ruit bedienbaar met de hand: voorbijgangers bladeren door de collectie, zoeken informatie op of spelen met uw merk, ook buiten openingstijden.",
		waarom: "Uw etalage is uw best gelegen reclamevlak, maar staat het grootste deel van de dag stil. Door de ruit interactief te maken werkt hij door als de winkel dicht is, en geeft hij passanten een reden om te blijven staan.",
		beeld: {
			src: "/media/miele-interactief-raam.webp",
			alt: "Bezoeker bedient een interactief raam met touch door het glas"
		},
		voordelen: [
			{
				kop: "24/7 verkoopkanaal",
				tekst: "De etalage communiceert dag en nacht: collectie, acties en informatie blijven bereikbaar als de deur dicht is."
			},
			{
				kop: "Onzichtbare techniek",
				tekst: "De touch foil is transparant en wordt binnen gemonteerd; buiten zijn geen onderdelen nodig en het glas blijft gewoon glas."
			},
			{
				kop: "Trekt passanten",
				tekst: "Optionele bewegingsdetectie start content zodra iemand langsloopt, van welkomstvideo tot productanimatie."
			}
		],
		toepassingen: [
			"Winkels en flagshipstores",
			"Makelaars en showrooms",
			"Leegstaande panden",
			"Banken en dienstverleners",
			"Musea"
		],
		technisch: [
			{
				kop: "Touch foil",
				tekst: "Transparante folie met een vrijwel onzichtbaar raster van draden werkt op projected capacitance: aanraking van het glas wordt door de folie gedetecteerd."
			},
			{
				kop: "Weergave",
				tekst: "Achter het glas werkt een projectiescherm, LCD of LED; de juiste keuze hangt af van licht, formaat en gewenst beeld."
			},
			{
				kop: "Extra's",
				tekst: "Uit te breiden met through-glass speakers en bewegingsdetectie die content start zodra iemand passeert."
			}
		],
		levering: "Vision2Watch levert de interactieve etalage compleet: folie, weergave, content en installatie, afgestemd op uw ruit en locatie. Te koop, met service en contentbeheer als optie.",
		galerij: [
			{
				src: "/media/timing-etalage-nacht.webp",
				alt: "Digitale etalage van Timing bij avond"
			},
			{
				src: "/media/outlet-etalage-beren.webp",
				alt: "Interactieve etalages met animaties in Outlet Roermond"
			},
			{
				src: "/media/shell-etalage-led.webp",
				alt: "Informatiescherm achter glas bij Shell Technology Centre"
			}
		],
		faq: [
			{
				vraag: "Werkt touch echt door het glas heen?",
				antwoord: "Ja. De transparante touch foil aan de binnenzijde detecteert via projected capacitance de aanraking van de ruit aan de buitenkant, ook met dikker etalageglas."
			},
			{
				vraag: "Wat gebeurt er als de winkel dicht is?",
				antwoord: "Dan werkt de etalage gewoon door: passanten bladeren door de collectie of bekijken informatie, 24 uur per dag. Juist buiten openingstijden bewijst de interactieve etalage zijn waarde."
			},
			{
				vraag: "Is dit ook interessant voor leegstaande panden?",
				antwoord: "Ja. Een interactieve of digitale etalage geeft een leeg pand uitstraling en maakt de ruit verhuurbaar als communicatie- of advertentievlak."
			}
		],
		projecten: ["outlet-store-roermond"],
		verwant: [
			"touchscreens",
			"transparant-scherm",
			"led-displays"
		]
	},
	{
		slug: "transparant-scherm",
		naam: "Transparant scherm",
		categorie: "schermen-en-displays",
		titel: "Transparant scherm voor productpresentatie | Vision2Watch",
		description: "Fysiek product en digitale content in één vitrine: transparante LCD-schermen van 10 tot 70 inch, standalone of netwerkgeschakeld, optioneel met touch.",
		intro: "Een transparant scherm combineert vier elementen: een behuizing, een transparant LCD-display met de juiste verlichting, uw fysieke product en digitale content. Het product staat uitgelicht ín de vitrine terwijl het scherm er beelden omheen en overheen toont: een unieke interactie tussen echt en digitaal.",
		waarom: "Klanten willen het echte product zien, maar het verhaal eromheen heeft beweging nodig. Het transparante scherm vertelt dat verhaal letterlijk om het product heen, zonder dat het product uit beeld verdwijnt.",
		beeld: {
			src: "/media/transparant-scherm-fles.webp",
			alt: "Transparant scherm met fysiek product en digitale animatie"
		},
		voordelen: [
			{
				kop: "Product blijft de ster",
				tekst: "Het echte product staat verlicht in de vitrine; transparante en dekkende beelden wisselen elkaar af rond het object."
			},
			{
				kop: "Compact tot groot",
				tekst: "Beschikbaar van 10 tot 70 inch, lichtgewicht en duurzaam uitgevoerd."
			},
			{
				kop: "Slim te schakelen",
				tekst: "Standalone of netwerkgeschakeld, zodat content per locatie of campagne centraal te beheren is."
			},
			{
				kop: "Optioneel touch",
				tekst: "Met touchfunctionaliteit bedienen bezoekers de presentatie zelf."
			}
		],
		toepassingen: [
			"Retail en etalages",
			"Productlanceringen",
			"Musea en vitrines",
			"Showrooms",
			"Luchthavens en publieksruimtes"
		],
		technisch: [
			{
				kop: "Opbouw",
				tekst: "Behuizing met interne LED-verlichting, transparant LCD-paneel en ruimte voor het fysieke product."
			},
			{
				kop: "Formaten",
				tekst: "Van 10 tot 70 inch; lichtgewicht en duurzaam ontwerp."
			},
			{
				kop: "Aansturing",
				tekst: "Standalone met lokale content of netwerkgeschakeld voor centraal beheer; optioneel met touch."
			}
		],
		levering: "Leverbaar per stuk of als serie voor meerdere locaties, inclusief contentproductie, installatie en beheer. Te koop en te huur voor campagnes.",
		galerij: [{
			src: "/media/transparant-scherm-nieuws.webp",
			alt: "Transparant scherm met live informatievoorziening"
		}, {
			src: "/media/transparant-toonbank.webp",
			alt: "Transparante displaytoonbank met productpresentatie"
		}],
		faq: [
			{
				vraag: "Hoe werkt een transparant scherm?",
				antwoord: "Een transparant LCD-paneel toont content terwijl het fysieke product erachter verlicht in de behuizing staat. Transparante en dekkende beelden wisselen elkaar af, waardoor digitale animatie en echt product samensmelten."
			},
			{
				vraag: "Kan de content op afstand beheerd worden?",
				antwoord: "Ja. Netwerkgeschakelde schermen zijn centraal aan te sturen, handig bij campagnes op meerdere locaties. Standalone gebruik kan uiteraard ook."
			},
			{
				vraag: "Voor welke producten is dit geschikt?",
				antwoord: "Vrijwel elk product dat in een vitrine past, van cosmetica en elektronica tot food. De verlichting en content stemmen we af op het object."
			}
		],
		projecten: [],
		verwant: [
			"interactieve-etalage",
			"touchscreens",
			"hereweholo"
		]
	},
	{
		slug: "led-displays",
		naam: "LED-displays",
		categorie: "schermen-en-displays",
		titel: "LED-displays en videowalls | Vision2Watch",
		description: "Van informatiescherm tot enorme videowall: LED-oplossingen voor binnen en buiten, inclusief flexibele en transparante glas-LED voor bijzondere ontwerpen.",
		intro: "LED-displays van Vision2Watch brengen beeld naar plekken waar gewone schermen ophouden: van kleine informatieschermen tot enorme videowalls op pleinen en gevels. Met hoogwaardige LED's en stabiele signage-software tonen ze advertenties, live beelden of realtime informatie, dag en nacht.",
		waarom: "Buiten en op afstand telt maar één ding: zichtbaarheid. LED levert helderheid en formaat die met projectie of LCD niet haalbaar zijn, en opent met flexibele en transparante varianten ontwerpmogelijkheden die een standaardscherm niet biedt.",
		beeld: {
			src: "/media/led-wand-kas.webp",
			alt: "Grote LED-videowall in een bedrijfsruimte"
		},
		voordelen: [
			{
				kop: "Elk formaat",
				tekst: "Van compact informatiescherm tot videowall op gebouwformaat, binnen en buiten."
			},
			{
				kop: "Flexibele LED",
				tekst: "Lichtgewicht panelen voor gebogen ontwerpen die naadloos aansluiten, voor creatieve toepassingen."
			},
			{
				kop: "Glas-LED",
				tekst: "Meer dan 80% transparantie, ideaal voor glazen puien: het beeld is perfect zichtbaar, zelfs in fel zonlicht, terwijl de pui open blijft ogen."
			},
			{
				kop: "Slimme aansturing",
				tekst: "Signage-software voor advertenties, live beelden en realtime informatie, centraal te beheren."
			}
		],
		toepassingen: [
			"Gevels en buitenreclame",
			"Winkelpuien",
			"Showrooms",
			"Events en podia",
			"Pleinen en publieksruimtes"
		],
		technisch: [
			{
				kop: "Uitvoeringen",
				tekst: "Standaard LED-panelen, flexibele LED voor gebogen vormen en transparante glas-LED voor puien."
			},
			{
				kop: "Helderheid",
				tekst: "Hoogwaardige LED's blijven zichtbaar in fel zonlicht, geschikt voor buitentoepassing."
			},
			{
				kop: "Content",
				tekst: "Aansturing met stabiele digital signage-software voor uiteenlopende content, van campagnes tot realtime informatie."
			}
		],
		levering: "Wij adviseren over de juiste LED-oplossing per locatie, verzorgen levering en montage en richten de contentaansturing in. Te koop, met serviceafspraken tot en met een SLA.",
		galerij: [{
			src: "/media/led-gevel.webp",
			alt: "LED-scherm aan een gevel"
		}],
		faq: [
			{
				vraag: "Wat is het verschil tussen LED en een gewoon scherm?",
				antwoord: "Een LED-display is opgebouwd uit lichtgevende panelen zonder maatbeperking: elk formaat is mogelijk en de helderheid is geschikt voor direct zonlicht. Daarmee is LED de keuze voor gevels, etalages en grote ruimtes."
			},
			{
				vraag: "Wat is glas-LED?",
				antwoord: "Transparante LED-strips die in of achter glas worden gemonteerd, met meer dan 80% transparantie. De pui blijft open ogen terwijl er beeld op verschijnt, zelfs bij fel zonlicht goed zichtbaar."
			},
			{
				vraag: "Kan de content op afstand worden bijgewerkt?",
				antwoord: "Ja. De signage-software stuurt schermen centraal aan, van één gevel tot meerdere locaties, met planning per dagdeel of campagne."
			}
		],
		projecten: ["starline"],
		verwant: [
			"transparant-scherm",
			"interactieve-etalage",
			"mixed-reality"
		]
	},
	{
		slug: "mixed-reality",
		naam: "Mixed reality & AR",
		kaartLabel: "Mixed reality",
		categorie: "schermen-en-displays",
		titel: "Augmented reality op grote schermen | Vision2Watch",
		description: "AR zonder telefoon: onze eigen Augmented engine mengt passanten live met digitale werelden op LED-schermen en videowalls. Van ontwikkeling tot complete installatie.",
		intro: "Augmented reality combineert de echte wereld met digitale beelden, video en geluid. Vision2Watch richt zich op AR via grote displays: met onze zelfontwikkelde Augmented engine zien passanten zichzelf live in een andere wereld op een LED-scherm of videowall, zonder telefoon of bril.",
		waarom: "De sterkste AR-ervaring is de ervaring waar je toevallig inloopt. Een passant die zichzelf op een groot scherm in een campagnewereld ziet staan, stopt, lacht en deelt dat moment, precies wat een campagne nodig heeft.",
		beeld: {
			src: "/media/timing-etalage-nacht.webp",
			alt: "AR-campagneschermen in de etalage van Timing"
		},
		voordelen: [
			{
				kop: "Geen app nodig",
				tekst: "De ervaring speelt zich af op het scherm in de ruimte; iedereen doet direct mee, zonder download."
			},
			{
				kop: "Eigen Augmented engine",
				tekst: "Zelfontwikkelde software, dus snel aan te passen aan campagne, locatie en interactie."
			},
			{
				kop: "Van idee tot installatie",
				tekst: "Alleen de AR-ontwikkeling of de complete oplossing met schermen, installatie en begeleiding: beide kan."
			}
		],
		toepassingen: [
			"Retailcampagnes",
			"Etalages",
			"Events",
			"Kantoren",
			"Publieksruimtes"
		],
		technisch: [
			{
				kop: "Werking",
				tekst: "Camera's mengen livebeeld met digitale elementen; passanten zien zichzelf in een aangepaste omgeving, bijvoorbeeld op een magazinecover of tussen effecten die op hen reageren."
			},
			{
				kop: "Displays",
				tekst: "Gericht op grote LCD-schermen en LED-videowalls voor maximale impact in de openbare ruimte."
			},
			{
				kop: "VR op maat",
				tekst: "Voor volledig ondergedompelde ervaringen maken we ook op maat gemaakte VR-content met audio en beeld."
			}
		],
		levering: "Van enkel de AR-ontwikkeling tot en met levering van schermen, installatie en begeleiding op locatie: u bepaalt de scope, wij leveren het geheel werkend op.",
		faq: [
			{
				vraag: "Hebben bezoekers een app of bril nodig?",
				antwoord: "Nee. De AR-ervaring draait op schermen in de ruimte; passanten zien zichzelf direct in de campagnewereld. Dat verlaagt de drempel tot nul."
			},
			{
				vraag: "Wat kan de Augmented engine?",
				antwoord: "Onze eigen engine mengt livebeeld met animaties en effecten: gekleurde rook die verdwijnt waar iemand staat, een passant op een magazinecover of een compleet daklicht met live beeld. Maatwerk per campagne."
			},
			{
				vraag: "Maakt Vision2Watch ook VR?",
				antwoord: "Ja, voor toepassingen waar volledige onderdompeling past maken we VR-content op maat, inclusief de benodigde hardware en begeleiding."
			}
		],
		projecten: ["outlet-store-roermond"],
		verwant: [
			"led-displays",
			"interactieve-etalage",
			"interactieve-vloer"
		]
	},
	{
		slug: "gebouw-projectie",
		naam: "Gebouwprojectie",
		categorie: "projectie-en-mapping",
		titel: "Gebouwprojectie en projection mapping | Vision2Watch",
		description: "3D-animaties exact gemapt op de architectuur van een gevel: ramen die openbreken, muren die bewegen. Voor events, festivals en publiekstrekkers.",
		intro: "Gebouwprojectie (projection mapping) projecteert 3D-animaties op de buitenkant van een gebouw, exact afgestemd op de architectuur. Ramen, pilaren en lijsten worden onderdeel van de animatie, waardoor het gebouw zelf lijkt te bewegen.",
		waarom: "Geen billboard haalt het bij een gevel die tot leven komt. Voor festivals, openingen en publieksevents is gebouwprojectie de manier om een locatie zelf tot attractie te maken, zichtbaar van straat tot skyline.",
		beeld: {
			src: "/media/gebouwprojectie-festival.webp",
			alt: "Grootschalige gebouwprojectie bij avond"
		},
		voordelen: [
			{
				kop: "Architectuur doet mee",
				tekst: "Door nauwkeurige mapping sluiten animaties perfect aan op ramen en pilaren; objecten lijken uit het gebouw te vliegen."
			},
			{
				kop: "Elke schaal",
				tekst: "Van dierenverblijf tot compleet kantoorpand: de techniek schaalt mee met de locatie."
			},
			{
				kop: "Compleet verzorgd",
				tekst: "Site survey, mapping, content en projectie op locatie: één team voor het hele traject."
			}
		],
		toepassingen: [
			"Festivals en events",
			"Openingen en jubilea",
			"Attracties en dierenparken",
			"Citymarketing",
			"Productlanceringen"
		],
		technisch: [
			{
				kop: "Site survey",
				tekst: "We beginnen met opmeten en fotograferen van de gevel en bouwen daarvan een exacte digitale 'map' waarop de animatie wordt ontworpen."
			},
			{
				kop: "3D-videomapping",
				tekst: "Animaties spelen met de diepte en vormen van het gebouw; bewegende beelden lijken met de architectuur te interacteren."
			},
			{
				kop: "Projectie",
				tekst: "Krachtige projectoren, waar nodig gecombineerd met edge-blending voor één naadloos beeld over de hele gevel."
			}
		],
		levering: "Gebouwprojectie is een maatwerkproductie per locatie: van survey en storyboard tot de projectie zelf, geleverd en bediend door ons team.",
		galerij: [{
			src: "/media/dierenpark-gebouwprojectie.webp",
			alt: "Gebouwprojectie op een dierenverblijf in DierenPark Amersfoort"
		}, {
			src: "/media/buitenprojectie-avond.webp",
			alt: "Buitenprojectie op groot scherm bij avond"
		}],
		faq: [
			{
				vraag: "Werkt gebouwprojectie op elk gebouw?",
				antwoord: "Vrijwel elk gebouw is geschikt; vorm en kleur van de gevel bepalen de aanpak. We meten de locatie vooraf op en maken de content exact passend op de architectuur."
			},
			{
				vraag: "Hoe lang duurt de voorbereiding?",
				antwoord: "Dat hangt af van formaat en gewenste animatie. Het traject bestaat uit site survey, contentproductie en opbouw; in de intake geven we een concrete planning voor uw locatie."
			},
			{
				vraag: "Kan het ook binnen?",
				antwoord: "Ja. Dezelfde mappingtechniek werkt op binnenwanden en objecten, zoals we bij DierenPark Amersfoort een compleet dierenverblijf tot leven brachten."
			}
		],
		projecten: ["dierenpark-amersfoort"],
		verwant: [
			"panoramische-projectie",
			"logo-animatie",
			"interactieve-muur"
		]
	},
	{
		slug: "panoramische-projectie",
		naam: "Panoramische projectie",
		categorie: "projectie-en-mapping",
		titel: "Panoramische en 360°-projectie | Vision2Watch",
		description: "Meeslepende projectie op 2, 3 of alle wanden tegelijk: van museumzaal tot dome-tent. Hardware, software en content als totaaloplossing.",
		intro: "Panoramische projectie omringt toeschouwers met beeld: van projectie over twee of drie wanden tot volledige 360-gradenervaringen en dome-tenten waarvan de hele binnenkant beeldvlak wordt. Meerdere projectoren worden met warping- en edge-blendingsoftware samengesmeed tot één naadloos panorama.",
		waarom: "Wie volledig door beeld wordt omringd, kan er niet omheen kijken: dat maakt panoramische projectie het sterkste middel voor verhalen die indruk moeten maken, in een museumzaal, op een beurs of in een experience center.",
		beeld: {
			src: "/media/panorama-kikkerzaal.webp",
			alt: "Panoramische projectiezaal met natuurbeelden op meerdere wanden"
		},
		voordelen: [
			{
				kop: "Maximale onderdompeling",
				tekst: "Bezoekers staan ín het verhaal in plaats van ertegenover; ideaal voor musea, merken en attracties."
			},
			{
				kop: "Schaalbaar concept",
				tekst: "Ook een mapping op 2 of 3 wanden geeft al een spectaculair effect; volledig 360° of een dome kan wanneer de ruimte erom vraagt."
			},
			{
				kop: "Binnen en buiten",
				tekst: "Toepasbaar in zalen, tenten en tijdelijke opstellingen, voor events én permanente installaties."
			}
		],
		toepassingen: [
			"Musea",
			"Experience centers",
			"Beurzen en events",
			"Recreatie",
			"Dome-tenten"
		],
		technisch: [
			{
				kop: "Multi-projectie",
				tekst: "Meerdere projectoren gekoppeld met warping en edge-blending vormen samen één naadloos beeld, tot volledige cirkels aan toe."
			},
			{
				kop: "Content",
				tekst: "Panoramische content wordt op maat geproduceerd of aangepast; onze studio bewaakt beeldkwaliteit over het hele projectievlak."
			},
			{
				kop: "Configuraties",
				tekst: "Van hoekopstelling tot 360°-zaal en dome-tenten waarbij de gehele binnenkant als projectievlak dient."
			}
		],
		levering: "Totaaloplossing met hardware, software en contentcreatie, voor tijdelijke events en vaste installaties. Wij ontwerpen, installeren en kalibreren op locatie.",
		galerij: [
			{
				src: "/media/marbella-muurprojectie.webp",
				alt: "Kleurrijke brede muurprojectie"
			},
			{
				src: "/media/immersive-kunstzaal.webp",
				alt: "Immersive projectiezaal met kunstwerken"
			},
			{
				src: "/media/symphony-cirkelvloer.webp",
				alt: "Circulaire projectieopstelling met vloerprojectie"
			}
		],
		faq: [
			{
				vraag: "Moet het altijd volledig 360 graden zijn?",
				antwoord: "Nee. Een mapping op twee of drie wanden geeft al een spectaculair effect en past in meer ruimtes. Volledige 360°-opstellingen en domes zetten we in waar maximale onderdompeling gevraagd is."
			},
			{
				vraag: "Is dit geschikt voor tijdelijke events?",
				antwoord: "Ja. Naast vaste installaties bouwen we tijdelijke opstellingen, bijvoorbeeld in dome-tenten op een festival of beurs, inclusief op- en afbouw."
			},
			{
				vraag: "Wie maakt de content?",
				antwoord: "Onze eigen studio produceert of bewerkt de panoramische content en kalibreert die op de opstelling, zodat het beeld over alle wanden naadloos klopt."
			}
		],
		projecten: ["escher-museum", "coffeeshop-marbella"],
		verwant: [
			"gebouw-projectie",
			"interactieve-muur",
			"virtual-chef"
		]
	},
	{
		slug: "logo-animatie",
		naam: "Logo-animatie",
		categorie: "projectie-en-mapping",
		titel: "Logo-animatie: uw merk in beweging | Vision2Watch",
		description: "Uw logo als dynamische projectie van licht en kleur, met 3D-effecten als vlammen of sneeuw. Voor kantoren, beursstands en gevels, 24/7 inzetbaar.",
		intro: "Met logo-animatie verandert uw statische logo in een bewegend beeld van licht en kleur. Geprojecteerd op een kantoormuur, congresachtergrond of beursstand, met 3D-animaties en effecten zoals vlammen of sneeuw die uw merk letterlijk laten opvallen.",
		waarom: "Een logo dat beweegt wordt onthouden. Voor entrees, stands en gevels is logo-animatie de eenvoudigste manier om een ruimte direct van uw merk te voorzien, zonder verbouwing.",
		beeld: {
			src: "/media/vloer-valentijn.webp",
			alt: "Merkprojectie met animatie op de vloer"
		},
		voordelen: [
			{
				kop: "Direct herkenbaar",
				tekst: "Uw bestaande logo, tot leven gebracht met beweging, diepte en effecten die bij uw merk passen."
			},
			{
				kop: "Overal toepasbaar",
				tekst: "Muur, vloer, plafond of gevel; binnen en buiten, tijdelijk of permanent."
			},
			{
				kop: "Onderhoudsarm",
				tekst: "Eenvoudige installatie, weinig onderhoud en 24/7 inzetbaar."
			}
		],
		toepassingen: [
			"Kantoren en entrees",
			"Beursstands",
			"Congressen",
			"Retail",
			"Gevels"
		],
		technisch: [
			{
				kop: "3D-projectie",
				tekst: "Logo's worden in 3D geprojecteerd met dynamische effecten, van subtiel licht tot vlammen of sneeuw."
			},
			{
				kop: "Maatwerkcontent",
				tekst: "Onze studio animeert uw logo passend bij uw huisstijl en de ruimte waar het komt."
			},
			{
				kop: "Installatie",
				tekst: "Compacte projectieopstelling, eenvoudig te installeren en te verplaatsen."
			}
		],
		levering: "Logo-animatie leveren we als complete opstelling met projector en content, te koop en te huur per event.",
		faq: [{
			vraag: "Kan elke huisstijl geanimeerd worden?",
			antwoord: "Ja. Onze studio werkt vanuit uw bestaande logo en huisstijl en stemt beweging en effecten daarop af, van ingetogen tot spectaculair."
		}, {
			vraag: "Is logo-animatie geschikt voor buiten?",
			antwoord: "Ja, met de juiste projector werkt logo-animatie ook op gevels en buitenvlakken, bijvoorbeeld tijdens een event of feestperiode."
		}],
		projecten: ["kanon"],
		verwant: [
			"gebouw-projectie",
			"interactieve-vloer",
			"led-displays"
		]
	}
];
var vindProduct = (slug) => PRODUCTEN.find((p) => p.slug === slug);
//#endregion
//#region src/components/site/Footer.tsx
var FOOTER_PRODUCTEN = [
	"interactieve-vloer",
	"hologram-projectie",
	"interactieve-etalage",
	"touchscreens",
	"led-displays",
	"virtual-host"
];
function Footer() {
	return /* @__PURE__ */ jsx("footer", {
		className: "border-t border-lijn bg-nacht",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx(Logo, { className: "text-lg" }),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-4 max-w-xs text-[0.95rem] leading-relaxed text-zacht",
							children: [
								"Interactieve audiovisuele oplossingen: van hologram tot interactieve vloer, van concept en content tot installatie en service. Sinds ",
								SITE.oprichtingsjaar,
								"."
							]
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "mt-6 flex gap-4",
							children: SITE.socials.map((s) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
								href: s.url,
								rel: "noopener",
								className: "text-[0.9rem] text-zacht transition-colors hover:text-accent",
								children: s.naam
							}) }, s.naam))
						})
					] }),
					/* @__PURE__ */ jsxs("nav", {
						"aria-label": "Footer: menu",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
							children: "Menu"
						}), /* @__PURE__ */ jsxs("ul", {
							className: "mt-4 space-y-2.5",
							children: [HOOFDNAV.map((i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
								to: i.pad,
								className: "text-[0.95rem] text-zacht transition-colors hover:text-tekst",
								children: i.label
							}) }, i.pad)), /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
								to: "/prijslijst",
								className: "text-[0.95rem] text-zacht transition-colors hover:text-tekst",
								children: "Prijslijst aanvragen"
							}) })]
						})]
					}),
					/* @__PURE__ */ jsxs("nav", {
						"aria-label": "Footer: producten",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
							children: "Producten"
						}), /* @__PURE__ */ jsx("ul", {
							className: "mt-4 space-y-2.5",
							children: FOOTER_PRODUCTEN.map((slug) => {
								const p = PRODUCTEN.find((x) => x.slug === slug);
								if (!p) return null;
								return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
									to: `/producten/${slug}`,
									className: "text-[0.95rem] text-zacht transition-colors hover:text-tekst",
									children: p.kaartLabel ?? p.naam
								}) }, slug);
							})
						})]
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
						className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
						children: "Contact"
					}), /* @__PURE__ */ jsxs("address", {
						className: "mt-4 space-y-2.5 not-italic text-[0.95rem] text-zacht",
						children: [
							/* @__PURE__ */ jsxs("p", { children: [
								SITE.adres.straat,
								/* @__PURE__ */ jsx("br", {}),
								SITE.adres.postcode,
								" ",
								SITE.adres.plaats
							] }),
							/* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", {
								href: `tel:${SITE.telefoon.algemeen.tel}`,
								className: "transition-colors hover:text-tekst",
								children: SITE.telefoon.algemeen.label
							}) }),
							/* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", {
								href: `mailto:${SITE.email}`,
								className: "transition-colors hover:text-tekst",
								children: SITE.email
							}) }),
							/* @__PURE__ */ jsxs("p", {
								className: "pt-2 text-[0.85rem] text-dof",
								children: [
									"KvK ",
									SITE.kvk,
									" · BTW ",
									SITE.btw
								]
							})
						]
					})] })
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-12 flex flex-col gap-3 border-t border-lijn pt-6 text-[0.85rem] text-dof md:flex-row md:items-center md:justify-between",
				children: [/* @__PURE__ */ jsxs("p", { children: [
					"© ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" ",
					SITE.juridischeNaam
				] }), /* @__PURE__ */ jsxs("ul", {
					className: "flex gap-5",
					children: [
						/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
							to: "/privacy",
							className: "transition-colors hover:text-zacht",
							children: "Privacy"
						}) }),
						/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
							to: "/algemene-voorwaarden",
							className: "transition-colors hover:text-zacht",
							children: "Algemene voorwaarden"
						}) }),
						/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
							href: "https://www.hereweholo.nl",
							rel: "noopener",
							className: "transition-colors hover:text-zacht",
							children: "HEREweHOLO"
						}) })
					]
				})]
			})]
		})
	});
}
//#endregion
//#region src/content/nl/categorieen.ts
var CATEGORIEEN = [
	{
		slug: "interactieve-projectie",
		naam: "Interactieve projectie",
		omschrijving: "Vloeren, muren en tafels die reageren op beweging en aanraking. Aangestuurd door onze eigen software, volledig in uw huisstijl."
	},
	{
		slug: "holografie",
		naam: "Holografie",
		omschrijving: "Producten en presentatoren die lijken te zweven: hologram-projectie, holografische molens en de holobox van zusterbedrijf HEREweHOLO."
	},
	{
		slug: "schermen-en-displays",
		naam: "Schermen & displays",
		omschrijving: "Van touchscreen en transparant scherm tot LED-wand en interactieve etalage: het juiste display voor elke ruimte en elke boodschap."
	},
	{
		slug: "projectie-en-mapping",
		naam: "Projectie & mapping",
		omschrijving: "Gebouwen, panorama's en logo's als projectievlak. Meeslepende beelden op elke schaal, binnen en buiten."
	}
];
//#endregion
//#region src/content/nl/projecten.ts
var PROJECTEN = [
	{
		slug: "werken-bij-defensie",
		klant: "Ministerie van Defensie",
		titel: "Interactieve vloer op DreamHack",
		description: "Voor de wervingscampagne Werken bij Defensie plaatsten we een interactieve gamevloer op DreamHack in Rotterdam Ahoy.",
		locatie: "Rotterdam Ahoy",
		sector: "beurzen-en-events",
		uitdaging: "Op gamefestival DreamHack strijden honderden stands en schermen om de aandacht van een jong publiek. Werken bij Defensie wilde bezoekers niet alleen bereiken, maar echt laten meedoen.",
		oplossing: "Vision2Watch plaatste een grote interactieve vloer in campagnestijl midden op het festival. Bezoekers speelden er samen op geprojecteerde spellen die reageerden op elke stap, precies passend bij het game-publiek en de boodschap van de campagne.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/dreamhack-vloer-breed.webp",
			alt: "Interactieve gamevloer voor Werken bij Defensie op DreamHack"
		},
		video: {
			src: "/media/video/dreamhack-interactieve-vloer.mp4",
			poster: "/media/video/dreamhack-interactieve-vloer-poster.webp",
			label: "De interactieve vloer in actie op DreamHack"
		}
	},
	{
		slug: "euroveiling",
		klant: "Euroveiling",
		titel: "Interactieve bloemenvloer voor 125 jaar Euroveiling",
		description: "Voor het 125-jarig jubileum van Euroveiling installeerden we namens Jada Events een interactieve vloer in bloemenstijl.",
		sector: "beurzen-en-events",
		uitdaging: "125 jaar Euroveiling vroeg om een viering die bezoekers zich zouden herinneren, passend bij het product waar alles om draait: bloemen.",
		oplossing: "Namens Jada Events installeerde Vision2Watch een interactieve vloer die bezoekers verwelkomde in echte Euroveiling-bloemenstijl: een gang vol bloemen met een vloer die bij elke stap tot bloei kwam.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/euroveiling-bloemenvloer.webp",
			alt: "Interactieve bloemenvloer op het jubileum van Euroveiling"
		},
		galerij: [{
			src: "/media/euroveiling-bloemengang-staand.webp",
			alt: "Bloemengang met interactieve vloer bij Euroveiling"
		}]
	},
	{
		slug: "clinique",
		klant: "Clinique",
		titel: "Interactieve bar voor de lancering van het glow serum",
		description: "In opdracht van Bolt Amsterdam bouwden we een interactieve bar die reageerde zodra iemand een flesje serum oppakte.",
		locatie: "Amsterdam",
		sector: "beurzen-en-events",
		uitdaging: "Voor de lancering van het nieuwe glow serum wilde Clinique (via Bolt Amsterdam) een presentatie die het product zelf liet spreken.",
		oplossing: "Vision2Watch creëerde een interactieve bar volledig in Clinique-stijl. Op de bar stonden vijf flesjes van het nieuwe serum; zodra iemand een flesje oppakte, verscheen op de bar een projectie met informatie over precies dat serum, net lang genoeg om nieuwsgierigheid te wekken en de boodschap over te brengen.",
		producten: ["interactieve-tafel"],
		beeld: {
			src: "/media/clinique-interactieve-bar.webp",
			alt: "Interactieve bar in Clinique-stijl met projectie rond de serumflesjes"
		}
	},
	{
		slug: "ouwehands-dierenpark",
		klant: "Ouwehands Dierenpark",
		titel: "Interactieve waterwereld als vaste attractie",
		description: "Bij Ouwehands Dierenpark draait een permanente interactieve vloer waarop bezoekers over het water lijken te lopen.",
		locatie: "Rhenen",
		sector: "musea-en-attracties",
		oplossing: "Ouwehands Dierenpark is een van de vaste partners waar onze interactieve vloeren permanent draaien. In de interactieve waterwereld lijkt het alsof bezoekers echt over het water lopen. Na een grondige update ligt de vloer er weer strak bij en kunnen de projectoren jaren vooruit; ook dat onderhoud hoort bij onze service.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/ouwehands-stenenvloer.webp",
			alt: "Interactieve waterwereldvloer bij Ouwehands Dierenpark"
		}
	},
	{
		slug: "dierenpark-amersfoort",
		klant: "DierenPark Amersfoort",
		titel: "Gebouwprojectie op het dierenverblijf",
		description: "Een op maat gemaakte gebouwprojectie brengt een dierenverblijf in DierenPark Amersfoort tot leven.",
		locatie: "Amersfoort",
		sector: "musea-en-attracties",
		uitdaging: "DierenPark Amersfoort wilde een verblijf laten opvallen met een visuele show die past bij het park en zijn bewoners.",
		oplossing: "We begonnen met het nauwkeurig opmeten van het gebouw, zodat de animaties exact aansluiten op de vormen en details van het verblijf. Het resultaat is een opvallende projectieshow die het gebouw laat stralen. Eerder ontwikkelden we voor het park ook een augmented-reality-ervaring rond attractie De Ooievaart.",
		producten: ["gebouw-projectie", "mixed-reality"],
		beeld: {
			src: "/media/dierenpark-gebouwprojectie.webp",
			alt: "Gebouwprojectie op een verblijf in DierenPark Amersfoort"
		}
	},
	{
		slug: "escher-museum",
		klant: "Escher Museum",
		titel: "Interactieve vloer en muur in het museum",
		description: "Voor het Escher Museum in Den Haag realiseerden we een interactieve vloer en muur die het werk van Escher beleefbaar maken.",
		locatie: "Den Haag",
		sector: "musea-en-attracties",
		oplossing: "Voor het Escher Museum in Den Haag realiseerde Vision2Watch een interactieve vloer en muur. Bezoekers stappen letterlijk in de wereld van Escher: de projecties reageren op beweging en maken het grafische werk fysiek beleefbaar. Voor het museum werd daarnaast speciale holografische content geproduceerd.",
		producten: [
			"interactieve-vloer",
			"interactieve-muur",
			"hologram-projectie"
		],
		beeld: {
			src: "/media/immersive-kunstzaal.webp",
			alt: "Immersive projectiezaal met grafisch werk"
		}
	},
	{
		slug: "sea-life",
		klant: "Sea Life",
		titel: "Sketchwall en interactieve vloer",
		description: "Kinderen tekenen hun eigen vis en zien die levensgroot rondzwemmen: de Sketchwall bij Sea Life, naast een permanente interactieve vloer.",
		sector: "musea-en-attracties",
		oplossing: "Bij Sea Life installeerden we een Sketchwall waar kinderen hun eigen vis tekenen en inscannen. Daarna verschijnt hun creatie levensgroot op de interactieve muur, zwemmend door het water, en schrikt hij zelfs als je hem aanraakt. Naast de Sketchwall draait bij Sea Life ook een permanente interactieve vloer.",
		producten: ["sketchwall", "interactieve-vloer"],
		beeld: {
			src: "/media/sketchwall-kinderen-aquarium.webp",
			alt: "Kinderen bij de Sketchwall van Sea Life"
		},
		galerij: [{
			src: "/media/sketchwall-kinderen.webp",
			alt: "Getekende vissen zwemmen over de interactieve wand"
		}]
	},
	{
		slug: "pierson-college",
		klant: "Pierson College",
		titel: "Interactieve vloer in de school",
		description: "Op het Pierson College in Den Bosch stimuleert een interactieve vloer leerlingen om te leren met de nieuwste technologie.",
		locatie: "Den Bosch",
		sector: "onderwijs",
		oplossing: "Op het Pierson College installeerden we een dynamische interactieve vloer waar leerlingen leren werken met de nieuwste technologie. De vloer stimuleert interactie en creativiteit en is volledig aanpasbaar aan elke huisstijl of lesinhoud.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/pierson-college-vloer.webp",
			alt: "Interactieve vloer met schoollogo op het Pierson College"
		}
	},
	{
		slug: "the-vic-leiden",
		klant: "Hotel VIC",
		titel: "Interactieve zee bij de liften",
		description: "In Hotel VIC in Leiden verandert een interactieve vloer met zee-animatie het wachten op de lift in een klein moment van beleving.",
		locatie: "Leiden",
		sector: "horeca-en-hotels",
		oplossing: "Voor Hotel VIC in Leiden toverden we het wachten op de lift om tot een unieke ervaring: een interactieve vloer met levensechte zee-animatie geeft gasten het gevoel dat ze met hun voeten in zee staan. Een speelse manier om de wachttijd te vergeten en de gastbeleving een niveau hoger te tillen.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/vloer-strand.webp",
			alt: "Interactieve strandvloer met zee-animatie"
		}
	},
	{
		slug: "coffeeshop-marbella",
		klant: "Coffeeshop Marbella",
		titel: "Muurprojectie met eigen visuals",
		description: "Een brede muurprojectie met kleurrijke visuals en animaties geeft de zaak van Marbella een eigen sfeer en een betere bezoekerservaring.",
		sector: "horeca-en-hotels",
		oplossing: "Voor coffeeshop Marbella maakte Vision2Watch een muurprojectie met kleurrijke visuals en animaties. De projectie geeft de ruimte een eigen gezicht en is eenvoudig te wisselen, een directe upgrade van de bezoekerservaring.",
		producten: ["interactieve-muur", "panoramische-projectie"],
		beeld: {
			src: "/media/marbella-muurprojectie.webp",
			alt: "Brede kleurrijke muurprojectie"
		}
	},
	{
		slug: "mcdonalds",
		klant: "McDonald's",
		titel: "Interactieve vloer voor de playground",
		description: "Een interactieve speelvloer voor de McDonald's playground: bewegen, spelen en verrassen tijdens het bezoek.",
		sector: "horeca-en-hotels",
		oplossing: "Voor de McDonald's playground leverde Vision2Watch een interactieve vloer waarop kinderen spelen met projecties die op hun bewegingen reageren, een attractie die het bezoek net wat langer en leuker maakt.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/vloerprojectie-grot.webp",
			alt: "Interactieve vloerprojectie in een speelomgeving"
		}
	},
	{
		slug: "castello",
		klant: "Castello",
		titel: "Interactieve wand",
		description: "Voor Castello realiseerden we een interactieve wand met projecties in merkstijl.",
		sector: "retail",
		oplossing: "Voor Castello bouwde Vision2Watch een interactieve wand waarin schermen en lijsten in de merkomgeving zijn opgenomen; de content wisselt en reageert op de omgeving.",
		producten: ["interactieve-muur"],
		beeld: {
			src: "/media/castello-projectie-lijsten.webp",
			alt: "Interactieve wand met ingelijste schermen bij Castello"
		}
	},
	{
		slug: "outlet-store-roermond",
		klant: "Designer Outlet Roermond",
		titel: "Interactieve vloeren en etalages in het outletcentrum",
		description: "Terugkerende projecten met interactieve vloeren en etalages waarin passanten in astronauten veranderen.",
		locatie: "Roermond",
		sector: "retail",
		oplossing: "Voor Outlet Store Roermond, een partner waarvoor we regelmatig terugkerende projecten realiseren, ontwierpen we meerdere interactieve vloeren. Daarnaast creëerden we interactieve etalages waarbij voorbijgangers werden omgetoverd tot astronauten terwijl ze langsliepen, extra belevingselementen die bezoekers vermaken en vasthouden.",
		producten: [
			"interactieve-vloer",
			"interactieve-etalage",
			"mixed-reality"
		],
		beeld: {
			src: "/media/outlet-roermond-avondvloer.webp",
			alt: "Vloerprojectie in de winkelstraat van Designer Outlet Roermond bij avond"
		},
		galerij: [{
			src: "/media/outlet-etalage-beren.webp",
			alt: "Interactieve etalages met animaties in Outlet Roermond"
		}, {
			src: "/media/outlet-etalage-bezoekers.webp",
			alt: "Bezoekers bij de interactieve etalage"
		}]
	},
	{
		slug: "nike",
		klant: "Nike",
		titel: "Interactieve vloer voor Nike",
		description: "Voor Nike realiseerde Vision2Watch een interactieve vloer.",
		sector: "retail",
		oplossing: "Voor Nike leverde Vision2Watch een interactieve vloer die bezoekers in beweging brengt, volledig afgestemd op de merkbeleving van Nike.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/nike-gebouw.webp",
			alt: "Nike-locatie met atletiekbaan voor de entree"
		}
	},
	{
		slug: "adidas",
		klant: "Adidas",
		titel: "Interactieve vloer in Amsterdam",
		description: "Een interactieve vloer voor Adidas in Amsterdam, met content die reageert op elke beweging.",
		locatie: "Amsterdam",
		sector: "retail",
		oplossing: "Voor Adidas in Amsterdam installeerden we een interactieve vloer met sportieve content die reageert op de bewegingen van bezoekers.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/vloer-sportteam.webp",
			alt: "Interactieve vloer met sportcontent"
		}
	},
	{
		slug: "nespresso",
		klant: "Nespresso",
		titel: "Interactieve vloer op maat",
		description: "Een op maat gemaakte interactieve vloer voor Nespresso.",
		sector: "retail",
		oplossing: "Voor Nespresso maakte Vision2Watch een interactieve vloer volledig op maat, afgestemd op de stijl en campagne van het merk.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/symphony-cirkelvloer.webp",
			alt: "Interactieve vloerprojectie in een showroomopstelling"
		}
	},
	{
		slug: "philips",
		klant: "Philips",
		titel: "Productdemonstratie op een interactieve vloer",
		description: "Een interactieve vloer die de functionaliteiten van een Philips-product speels en boeiend liet zien.",
		sector: "showrooms-en-kantoren",
		oplossing: "Voor Philips creëerden we een interactieve vloer die op een speelse en boeiende manier de functionaliteiten van het product liet zien: productdemonstratie en beleving in één.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/beursstand-donker.webp",
			alt: "Interactieve vloerprojectie tijdens een presentatie"
		}
	},
	{
		slug: "tieleman-keukens",
		klant: "Tieleman Keukens",
		titel: "Interactieve vloer in de keukenshowroom",
		description: "Een interactieve vloer geeft de showroom van Tieleman Keukens in Zeeland een extra dimensie.",
		locatie: "Zeeland",
		sector: "showrooms-en-kantoren",
		oplossing: "Voor Tieleman Keukens installeerden we een interactieve vloer in de showroom: een verrassingselement dat bezoekers vasthoudt tijdens hun oriëntatie op een nieuwe keuken.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/tieleman-vloer.webp",
			alt: "Interactieve vloerprojectie in een showroomopstelling"
		}
	},
	{
		slug: "rtl",
		klant: "RTL",
		titel: "Draagbare iFloor als interactieve entree",
		description: "Met het draagbare iFloor-systeem kreeg een RTL-event een interactieve rode loper, ondanks beperkte ruimte en hoogte.",
		locatie: "Hilversum",
		sector: "beurzen-en-events",
		uitdaging: "RTL wilde een interactieve en aantrekkelijke entree voor een evenement, maar de locatie bood beperkte ruimte en minimale hoogte.",
		oplossing: "Met ons draagbare iFloor-systeem rolden we letterlijk de perfecte rode loper uit: snel opgebouwd, volledig aanpasbaar aan elke huisstijl en dus naadloos aansluitend bij het event.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/vloer-valentijn.webp",
			alt: "Interactieve vloerprojectie als entree-loper"
		}
	},
	{
		slug: "starline",
		klant: "Starline",
		titel: "Interactieve vloer en wand op Ebben Inspyrium",
		description: "Voor de beursstand van zwembadfabrikant Starline realiseerden we een interactieve vloer en wand.",
		locatie: "Cuijk",
		sector: "beurzen-en-events",
		oplossing: "Voor de stand van Starline op beurs Ebben Inspyrium verzorgden we een interactieve vloer en wand: water dat reageert op elke stap, precies passend bij een zwembadmerk, met de merknaam als blikvanger in de projectie.",
		producten: [
			"interactieve-vloer",
			"interactieve-muur",
			"led-displays"
		],
		beeld: {
			src: "/media/starline-zandvloer.webp",
			alt: "Interactieve zandvloer met Starline-branding"
		},
		galerij: [{
			src: "/media/starline-stand-scherm.webp",
			alt: "Beursstand van Starline met groot projectiescherm"
		}]
	},
	{
		slug: "kanon",
		klant: "Kanon Loading Equipment",
		titel: "Interactief looppad op StocExpo",
		description: "Een interactief tussenpad voor Kanon Loading Equipment op StocExpo in Rotterdam Ahoy.",
		locatie: "Rotterdam Ahoy",
		sector: "beurzen-en-events",
		oplossing: "Voor Kanon Loading Equipment maakte Vision2Watch een interactief tussenpad op StocExpo in Rotterdam Ahoy: het gangpad zelf werd de blikvanger die bezoekers naar de stand leidde.",
		producten: ["interactieve-vloer", "logo-animatie"],
		beeld: {
			src: "/media/beursstand-donker.webp",
			alt: "Interactief verlicht looppad op een beursstand"
		}
	},
	{
		slug: "bloemenbureau-holland",
		klant: "Bloemenbureau Holland",
		titel: "Interactieve vloer op de Trade Fair",
		description: "In samenwerking met Heleen Valstar BV: een interactieve bloemenvloer die beursbezoekers trok én betrok.",
		sector: "beurzen-en-events",
		uitdaging: "Bloemenbureau Holland wilde op de Trade Fair een stand die niet alleen aandacht trok, maar bezoekers ook actief betrok.",
		oplossing: "In samenwerking met Heleen Valstar BV plaatsten we een interactieve vloerprojectie. We hingen de projectoren in de truss, stelden de vloer zorgvuldig af en testten de interactie tot alles klopte. Het resultaat: een vloer die opviel, interactie uitlokte en bleef verrassen.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/bloemenbureau-opbouw.webp",
			alt: "Opbouw van de interactieve vloer voor Bloemenbureau Holland"
		}
	},
	{
		slug: "alpro-interactieve-vloer",
		klant: "Alpro",
		titel: "Interactieve vloer in Westfield Mall of the Netherlands",
		description: "Een interactieve vloerprojectie leidde bezoekers speels door de Alpro-stand in Westfield Mall of the Netherlands.",
		locatie: "Leidschendam",
		sector: "retail",
		uitdaging: "Alpro zocht een manier om bezoekers op een speelse en unieke manier door hun stand in Westfield Mall of the Netherlands te leiden.",
		oplossing: "Onze oplossing: een interactieve vloer in Alpro-stijl die niet alleen de aandacht trok, maar bezoekers ook betrokken hield, merkactivatie waar je doorheen loopt.",
		producten: ["interactieve-vloer"],
		beeld: {
			src: "/media/alpro-stand-vloer.webp",
			alt: "Interactieve vloer in Alpro-huisstijl in Westfield Mall of the Netherlands"
		}
	}
];
var vindProject = (slug) => PROJECTEN.find((p) => p.slug === slug);
//#endregion
//#region src/content/nl/sectoren.ts
var SECTOREN = [
	{
		slug: "beurzen-en-events",
		naam: "Beurzen & events",
		titel: "Interactieve beursstand en eventtechnologie | Vision2Watch",
		description: "Val op tussen honderden stands: interactieve vloeren, hologrammen en virtual hosts die bezoekers naar uw stand trekken en vasthouden. Huur per event, inclusief opbouw.",
		intro: "Op een beurs heeft u seconden om een passant te laten stoppen. Vision2Watch bouwt de blikvangers die dat doen: vloeren waarop bezoekers spelen, hologrammen die uw product laten zweven en virtuele hosts die iedereen persoonlijk aanspreken. Te huur per event, opgebouwd en afgesteld door ons eigen team.",
		beeld: {
			src: "/media/dreamhack-vloer-breed.webp",
			alt: "Interactieve gamevloer op DreamHack in Rotterdam Ahoy"
		},
		situaties: [
			{
				kop: "Bezoekers laten stoppen",
				tekst: "Een interactieve vloer of muur verandert het gangpad in een spel. Wie eroverheen loopt, is al met uw merk in gesprek, zoals het interactieve looppad dat wij voor Kanon Loading Equipment op StocExpo bouwden."
			},
			{
				kop: "Uw product als eyecatcher",
				tekst: "Hologram-projectie of een holobox laat uw product levensgroot zweven, ook als het fysiek te groot, te klein of te kostbaar is voor de stand."
			},
			{
				kop: "Altijd iemand die het verhaal vertelt",
				tekst: "De Virtual Host spreekt elke passant automatisch aan en vertelt uw verhaal, ook op de momenten dat uw standbemanning in gesprek is."
			},
			{
				kop: "Snel op en af",
				tekst: "Met het draagbare iFloor-systeem staat een interactieve entree ook bij beperkte ruimte en hoogte, zoals bij RTL. Huur is inclusief opbouw, afstelling en afbouw."
			}
		],
		producten: [
			"interactieve-vloer",
			"interactieve-muur",
			"hologram-projectie",
			"virtual-host",
			"hereweholo",
			"logo-animatie"
		],
		projecten: [
			"werken-bij-defensie",
			"euroveiling",
			"starline",
			"kanon",
			"bloemenbureau-holland",
			"rtl",
			"clinique"
		],
		faq: [
			{
				vraag: "Kan ik interactieve technologie voor één beurs huren?",
				antwoord: "Ja. Vrijwel al onze oplossingen zijn per event te huren, inclusief transport, opbouw, afstelling en afbouw door ons team. Bij aankoop zet u het systeem daarna onbeperkt opnieuw in."
			},
			{
				vraag: "Hoe snel staat een interactieve vloer op een beurs?",
				antwoord: "Het draagbare iFloor-systeem is ontworpen voor snelle opbouw, ook bij beperkte ruimte en hoogte. De exacte planning stemmen we af op de op- en afbouwtijden van de beurs."
			},
			{
				vraag: "Kan de content per beurs worden aangepast?",
				antwoord: "Ja. Onze studio maakt de content per event op maat: uw huisstijl, campagne of zelfs een spel rond uw product."
			}
		]
	},
	{
		slug: "retail",
		naam: "Retail",
		titel: "Retailtechnologie: etalages en winkelbeleving | Vision2Watch",
		description: "Interactieve etalages, vloerprojecties en transparante schermen die passanten laten stoppen en de winkelervaring versterken, 24 uur per dag.",
		intro: "In retail is de etalage uw best gelegen reclamevlak en de winkelvloer uw podium. Vision2Watch maakt beide actief: ruiten die reageren op touch, vloeren die tot leven komen en schermen waarin echt product en digitale content samensmelten.",
		beeld: {
			src: "/media/outlet-roermond-avondvloer.webp",
			alt: "Vloerprojectie in de winkelstraat van Designer Outlet Roermond"
		},
		situaties: [
			{
				kop: "De etalage werkt door na sluitingstijd",
				tekst: "Een interactieve etalage met touch foil laat passanten 24/7 door de collectie bladeren, zoals de digitale etalages die wij voor Timing en Outlet Roermond realiseerden."
			},
			{
				kop: "Beleving in de winkelstraat",
				tekst: "Vloerprojecties en AR-schermen verrassen passanten, van astronauten in de etalage tot een campagnevloer voor de deur."
			},
			{
				kop: "Product en verhaal in één vitrine",
				tekst: "Het transparante scherm toont animaties óm uw echte product heen; de holografische molen laat het product zwevend in de ruimte zien."
			},
			{
				kop: "Merkactivaties die blijven hangen",
				tekst: "Voor lanceringen bouwen we interactieve opstellingen op maat, zoals de bar voor Clinique die reageerde zodra iemand een flesje oppakte."
			}
		],
		producten: [
			"interactieve-etalage",
			"transparant-scherm",
			"led-displays",
			"interactieve-vloer",
			"holografische-molen",
			"mixed-reality"
		],
		projecten: [
			"outlet-store-roermond",
			"nike",
			"adidas",
			"nespresso",
			"alpro-interactieve-vloer",
			"castello"
		],
		faq: [{
			vraag: "Wat levert een interactieve etalage op?",
			antwoord: "Uw ruit communiceert ook buiten openingstijden: passanten bekijken de collectie, zoeken informatie op en onthouden de winkel. De etalage wordt van statisch uithangbord een actief kanaal."
		}, {
			vraag: "Werkt dit ook in een klein winkelpand?",
			antwoord: "Ja. Van een enkele holografische molen of een transparant scherm in de vitrine tot een complete interactieve pui: we stemmen de oplossing af op de maat van het pand."
		}]
	},
	{
		slug: "musea-en-attracties",
		naam: "Musea & attracties",
		titel: "Interactieve installaties voor musea en attracties | Vision2Watch",
		description: "Van interactieve vloeren tot gebouwprojectie: installaties die bezoekers van musea, dierenparken en attracties laten meedoen in plaats van alleen kijken.",
		intro: "Musea, dierenparken en attracties draaien om beleving. Vision2Watch bouwt installaties waarmee bezoekers zelf het verhaal in stappen: vloeren en muren die reageren, tekeningen die tot leven komen en gevels die veranderen in een projectieshow.",
		beeld: {
			src: "/media/sketchwall-kinderen-aquarium.webp",
			alt: "Kinderen bij de Sketchwall van Sea Life"
		},
		situaties: [
			{
				kop: "Van kijken naar meedoen",
				tekst: "In het Escher Museum stappen bezoekers via een interactieve vloer en muur letterlijk in het werk; bij Sea Life zwemt je eigen getekende vis door het aquarium."
			},
			{
				kop: "Attracties zonder wachtrijverveling",
				tekst: "Interactieve projecties maken van wachten spelen, en van een doorloopruimte een attractie op zich, zoals de permanente waterwereld bij Ouwehands Dierenpark."
			},
			{
				kop: "Het gebouw als verhaal",
				tekst: "Met gebouwprojectie wordt een verblijf of gevel zelf de show, zoals in DierenPark Amersfoort."
			},
			{
				kop: "Panorama's die omringen",
				tekst: "Panoramische en 360°-projecties dompelen bezoekers volledig onder in een collectie of thema, van museumzaal tot dome-tent."
			}
		],
		producten: [
			"interactieve-vloer",
			"sketchwall",
			"gebouw-projectie",
			"panoramische-projectie",
			"interactieve-muur",
			"hologram-projectie"
		],
		projecten: [
			"escher-museum",
			"sea-life",
			"dierenpark-amersfoort",
			"ouwehands-dierenpark"
		],
		faq: [{
			vraag: "Zijn de installaties bestand tegen dagelijks publieksgebruik?",
			antwoord: "Ja. Onze vloeren en wanden draaien permanent op drukbezochte locaties zoals Ouwehands Dierenpark en Sea Life; met periodiek onderhoud gaan projectoren en systemen jaren mee."
		}, {
			vraag: "Kan de content aansluiten op onze collectie of thema?",
			antwoord: "Dat is precies ons werk: onze eigen studio ontwikkelt content per collectie, tentoonstelling of seizoen, en kan die later blijven vernieuwen."
		}]
	},
	{
		slug: "horeca-en-hotels",
		naam: "Horeca & hotels",
		titel: "Beleving voor horeca en hotels | Vision2Watch",
		description: "Virtual Chef-tafelprojectie, interactieve vloeren en sfeerprojecties die van een bezoek een verhaal maken, van restaurant tot hotellobby.",
		intro: "Gasten onthouden geen vierkante meters maar momenten. Vision2Watch bouwt die momenten met projectie: een mini-chef die het gerecht op tafel bereidt, een lobby waar je met je voeten in zee staat en zalen die per avond van sfeer wisselen.",
		beeld: {
			src: "/media/virtual-chef-tafelrond.webp",
			alt: "Virtual Chef-projectie op een gedekte ronde tafel"
		},
		situaties: [
			{
				kop: "Dineren als voorstelling",
				tekst: "Met de Virtual Chef verschijnt een mini-chef op tafel die het gerecht speels bereidt, het concept achter successen als Le Petit Chef."
			},
			{
				kop: "De lobby als eerste indruk",
				tekst: "In Hotel VIC in Leiden staat wachten op de lift gelijk aan pootjebaden: een interactieve zee-animatie bij de liften maakt van een verloren moment een glimlach."
			},
			{
				kop: "Sfeer die meebeweegt",
				tekst: "Muur- en tafelprojecties transformeren de hele zaal per thema of avond, zoals de kleurrijke muurprojectie voor coffeeshop Marbella."
			},
			{
				kop: "Spelen terwijl het eten komt",
				tekst: "Een interactieve speelvloer, zoals bij de McDonald's playground, houdt jonge gasten vrolijk bezig."
			}
		],
		producten: [
			"virtual-chef",
			"interactieve-vloer",
			"interactieve-tafel",
			"interactieve-muur",
			"panoramische-projectie"
		],
		projecten: [
			"the-vic-leiden",
			"coffeeshop-marbella",
			"mcdonalds"
		],
		faq: [{
			vraag: "Is tafelprojectie geschikt voor ons restaurant?",
			antwoord: "In de meeste zalen wel; tafelmaat, kleur en omgevingslicht bepalen de aanpak. We komen graag langs of demonstreren het concept in onze showroom."
		}, {
			vraag: "Kunnen we de content zelf wisselen per avond of seizoen?",
			antwoord: "Ja. De content is eenvoudig te wisselen en onze studio levert nieuwe thema's wanneer u die nodig heeft, van kerstdiner tot zomerterras."
		}]
	},
	{
		slug: "onderwijs",
		naam: "Onderwijs",
		titel: "Interactieve vloer voor school en onderwijs | Vision2Watch",
		description: "Interactieve vloeren die leerlingen letterlijk in beweging brengen: spelen, samenwerken en leren met de nieuwste projectietechnologie.",
		intro: "Bewegend leren werkt. Met een interactieve vloer halen scholen technologie in huis waar leerlingen samen op spelen, ontdekken en leren, van spelvormen tot content die aansluit op de les.",
		beeld: {
			src: "/media/pierson-college-vloer.webp",
			alt: "Interactieve vloer met schoollogo op het Pierson College"
		},
		situaties: [
			{
				kop: "Leren door te doen",
				tekst: "Op het Pierson College in Den Bosch leren leerlingen werken met de nieuwste technologie op een vloer die interactie en creativiteit stimuleert."
			},
			{
				kop: "Van aula tot gymzaal",
				tekst: "De vloer projecteert overal: als blikvanger in de aula, als beweegvloer in de gymzaal of als speelplek in de onderbouw."
			},
			{
				kop: "Content in schoolstijl",
				tekst: "Logo, kleuren en eigen spelvormen: de content is volledig aanpasbaar aan de school en het lesprogramma."
			}
		],
		producten: [
			"interactieve-vloer",
			"interactieve-muur",
			"touchscreens",
			"sketchwall"
		],
		projecten: ["pierson-college"],
		faq: [{
			vraag: "Is een interactieve vloer geschikt voor jonge kinderen?",
			antwoord: "Ja. De vloer reageert op elke beweging en kent geen losse onderdelen; kinderen spelen er veilig samen op, van onderbouw tot bovenbouw."
		}, {
			vraag: "Koop of huur voor een school?",
			antwoord: "Beide kan. Voor vast gebruik is koop met een servicecontract gebruikelijk; voor een themaweek of open dag is huren per periode mogelijk."
		}]
	},
	{
		slug: "showrooms-en-kantoren",
		naam: "Showrooms & kantoren",
		titel: "Interactieve showroom- en kantoorbeleving | Vision2Watch",
		description: "Maak van uw showroom of kantoor een omgeving die uw verhaal vertelt: interactieve vloeren, tafels, LED en projectie, geïntegreerd en beheerd door één partij.",
		intro: "Een showroom moet verkopen als de verkoper even weg is, en een kantoor moet vertellen wie u bent. Vision2Watch integreert projectie, touch en LED tot omgevingen die dat doen: van productdemonstratie op de vloer tot een interactieve overzichtstafel in de ontvangstruimte.",
		beeld: {
			src: "/media/interactieve-tafel-kaart.webp",
			alt: "Interactieve overzichtstafel met bezoekers in een showroom"
		},
		situaties: [
			{
				kop: "Producten die zichzelf uitleggen",
				tekst: "Voor Philips liet een interactieve vloer de functionaliteiten van het product speels zien; een transparant scherm of hologram doet hetzelfde in de vitrine."
			},
			{
				kop: "De showroom als ervaring",
				tekst: "Bij Tieleman Keukens houdt een interactieve vloer bezoekers vast tijdens de oriëntatie; panoramische projectie zet complete belevingsruimtes neer."
			},
			{
				kop: "Ontvangst met verhaal",
				tekst: "Een interactieve tafel of virtual host in de entree vertelt bezoekers direct waar uw organisatie voor staat, zoals de AR-installatie waarmee we het kantoor van Timing tot leven brachten."
			}
		],
		producten: [
			"interactieve-vloer",
			"interactieve-tafel",
			"touchscreens",
			"transparant-scherm",
			"led-displays",
			"panoramische-projectie"
		],
		projecten: ["tieleman-keukens", "philips"],
		faq: [{
			vraag: "Kan Vision2Watch ook de content blijven beheren?",
			antwoord: "Ja. Naast levering en installatie verzorgen we contentupdates en onderhoud, van losse opdrachten tot een doorlopende serviceovereenkomst (SLA)."
		}, {
			vraag: "Werkt dit ook in een bestaande showroom?",
			antwoord: "In vrijwel elke ruimte. Projectoren hangen we onopvallend aan het plafond of zetten we in bestaande interieurdelen; bij de intake bekijken we licht, maten en zichtlijnen."
		}]
	}
];
var vindSector = (slug) => SECTOREN.find((s) => s.slug === slug);
//#endregion
//#region src/components/ui/Knop.tsx
var stijlen = {
	primair: "bg-accent text-inkt hover:bg-accent-fel active:bg-accent-diep font-medium",
	secundair: "border border-lijn text-tekst hover:border-accent hover:text-accent"
};
function Knop({ naar, children, variant = "primair", className = "" }) {
	const basis = "inline-flex items-center gap-2 rounded-klein px-6 py-3 font-display text-[0.95rem] transition-colors duration-200";
	const inhoud = /* @__PURE__ */ jsxs(Fragment, { children: [children, /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: "translate-y-[0.5px] transition-transform duration-200 group-hover/knop:translate-x-0.5",
		children: "→"
	})] });
	if (naar.startsWith("http") || naar.startsWith("tel:") || naar.startsWith("mailto:")) return /* @__PURE__ */ jsx("a", {
		href: naar,
		className: `group/knop ${basis} ${stijlen[variant]} ${className}`,
		children: inhoud
	});
	return /* @__PURE__ */ jsx(Link, {
		to: naar,
		className: `group/knop ${basis} ${stijlen[variant]} ${className}`,
		children: inhoud
	});
}
//#endregion
//#region src/components/ui/Reveal.tsx
function Reveal({ children, vertraging = 0, as: Tag = "div", className = "" }) {
	const ref = useRef(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) if (e.isIntersecting) {
				e.target.classList.add("zichtbaar");
				io.unobserve(e.target);
			}
		}, { rootMargin: "0px 0px -8% 0px" });
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return /* @__PURE__ */ jsx(Tag, {
		ref,
		className: `reveal ${className}`,
		style: vertraging ? { transitionDelay: `${vertraging}ms` } : void 0,
		children
	});
}
//#endregion
//#region src/components/ui/Sectie.tsx
function Sectie({ kicker, kop, lead, children, className = "", kopNiveau = "h2", id }) {
	const Kop = kopNiveau;
	return /* @__PURE__ */ jsx("section", {
		id,
		className: `py-20 md:py-28 ${className}`,
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 md:px-8",
			children: [(kicker || kop) && /* @__PURE__ */ jsxs(Reveal, {
				className: "max-w-3xl",
				children: [
					kicker && /* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: kicker
					}),
					kop && /* @__PURE__ */ jsx(Kop, {
						className: "text-3xl font-medium md:text-[2.6rem] md:leading-[1.1]",
						children: kop
					}),
					lead && /* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: lead
					})
				]
			}), children]
		})
	});
}
//#endregion
//#region src/components/site/HeroVideo.tsx
function HeroVideo({ src, poster, label, className = "" }) {
	const ref = useRef(null);
	const [speelt, setSpeelt] = useState(false);
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(mq.matches);
		const video = ref.current;
		if (!video) return;
		if (mq.matches) {
			video.removeAttribute("autoplay");
			video.pause();
		} else video.play().catch(() => void 0);
		const bij = () => setSpeelt(!video.paused);
		video.addEventListener("play", bij);
		video.addEventListener("pause", bij);
		return () => {
			video.removeEventListener("play", bij);
			video.removeEventListener("pause", bij);
		};
	}, []);
	const wissel = () => {
		const video = ref.current;
		if (!video) return;
		if (video.paused) video.play().catch(() => void 0);
		else video.pause();
	};
	return /* @__PURE__ */ jsxs("div", {
		className: `relative ${className}`,
		children: [/* @__PURE__ */ jsx("video", {
			ref,
			muted: true,
			playsInline: true,
			loop: true,
			autoPlay: !reduced,
			preload: "none",
			poster,
			"aria-label": label,
			className: "h-full w-full object-cover",
			children: /* @__PURE__ */ jsx("source", {
				src,
				type: "video/mp4"
			})
		}), /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: wissel,
			className: "absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-inkt/60 text-tekst backdrop-blur-sm transition-colors hover:border-accent",
			children: [/* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: speelt ? "Video pauzeren" : "Video afspelen"
			}), speelt ? /* @__PURE__ */ jsx("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 14 14",
				"aria-hidden": "true",
				fill: "currentColor",
				children: /* @__PURE__ */ jsx("path", { d: "M2.5 1h3v12h-3zM8.5 1h3v12h-3z" })
			}) : /* @__PURE__ */ jsx("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 14 14",
				"aria-hidden": "true",
				fill: "currentColor",
				children: /* @__PURE__ */ jsx("path", { d: "M3 1.5l9 5.5-9 5.5z" })
			})]
		})]
	});
}
//#endregion
//#region src/data/beeldmaten.ts
var BEELDMATEN = {
	"/media/alpro-stand-vloer.webp": [841, 1583],
	"/media/beursstand-donker.webp": [1170, 1170],
	"/media/beursstand-fotolight.webp": [720, 960],
	"/media/beursstand-hostess.webp": [1024, 768],
	"/media/bloemenbureau-opbouw.webp": [1200, 1600],
	"/media/buitenprojectie-avond.webp": [1024, 576],
	"/media/castello-projectie-lijsten.webp": [1045, 650],
	"/media/clinique-interactieve-bar.webp": [1600, 739],
	"/media/dierenpark-gebouwprojectie.webp": [1200, 1600],
	"/media/dreamhack-vloer-breed.webp": [1600, 898],
	"/media/epson-printer-hologram.webp": [1200, 1046],
	"/media/euroveiling-bloemengang-staand.webp": [1200, 900],
	"/media/euroveiling-bloemenvloer.webp": [1600, 1200],
	"/media/gebouwprojectie-festival.webp": [1080, 1080],
	"/media/holobox-buiten.webp": [1200, 675],
	"/media/holobox-restaurant.webp": [1200, 798],
	"/media/holografische-molen-schoen.webp": [1200, 583],
	"/media/holografische-molen.webp": [1200, 900],
	"/media/hologram-groep-podium.webp": [1200, 1200],
	"/media/hologram-podium-roze.webp": [1200, 675],
	"/media/immersive-kunstzaal.webp": [1024, 678],
	"/media/interactieve-tafel-kaart.webp": [1024, 768],
	"/media/interactieve-tafel-overleg.webp": [1080, 1080],
	"/media/led-gevel.webp": [1200, 622],
	"/media/led-wand-kas.webp": [1600, 1200],
	"/media/logo-v2w.webp": [400, 400],
	"/media/marbella-muurprojectie.webp": [1170, 655],
	"/media/miele-interactief-raam.webp": [405, 306],
	"/media/mm-interactieve-tafel.webp": [1024, 768],
	"/media/mm-winkel-entree.webp": [1024, 683],
	"/media/muurprojectie-bakkerij.webp": [582, 314],
	"/media/muurprojectie-groen.webp": [1080, 1080],
	"/media/nike-gebouw.webp": [1170, 1025],
	"/media/outlet-etalage-beren.webp": [1024, 571],
	"/media/outlet-etalage-bezoekers.webp": [1080, 1080],
	"/media/outlet-roermond-avondvloer.webp": [1170, 658],
	"/media/ouwehands-stenenvloer.webp": [953, 1600],
	"/media/panorama-kikkerzaal.webp": [1080, 1080],
	"/media/pierson-college-vloer.webp": [1150, 1150],
	"/media/shell-etalage-dag.webp": [1200, 675],
	"/media/shell-etalage-led.webp": [1080, 1080],
	"/media/sketchwall-aquariumwand.webp": [1200, 583],
	"/media/sketchwall-kinderen-aquarium.webp": [1080, 1080],
	"/media/sketchwall-kinderen.webp": [630, 378],
	"/media/starline-stand-scherm.webp": [1600, 866],
	"/media/starline-zandvloer.webp": [1170, 647],
	"/media/studio-content-werkplek.webp": [1200, 691],
	"/media/studio-ruimte.webp": [1200, 900],
	"/media/symphony-cirkelvloer.webp": [1600, 1200],
	"/media/tieleman-vloer.webp": [1200, 1600],
	"/media/timing-etalage-nacht.webp": [800, 450],
	"/media/touchscreen-kassa-retail.webp": [960, 720],
	"/media/touchscreen-zuil-beurs.webp": [1200, 900],
	"/media/transparant-scherm-fles.webp": [1200, 675],
	"/media/transparant-scherm-nieuws.webp": [1200, 674],
	"/media/transparant-toonbank.webp": [1600, 1237],
	"/media/virtual-chef-tafelrond.webp": [1080, 1080],
	"/media/virtual-host-buitenunit.webp": [1200, 900],
	"/media/virtual-host-lounge.webp": [1200, 900],
	"/media/virtual-host-silhouet.webp": [1080, 1080],
	"/media/vloer-sportteam.webp": [1170, 660],
	"/media/vloer-strand.webp": [908, 1600],
	"/media/vloer-valentijn.webp": [1080, 1080],
	"/media/vloerprojectie-grot.webp": [566, 298],
	"/media/logo/24-7-events.webp": [400, 400],
	"/media/logo/alpro.webp": [290, 142],
	"/media/logo/bloemenbureau-holland.webp": [201, 78],
	"/media/logo/defensie.webp": [225, 225],
	"/media/logo/escher-museum.webp": [171, 295],
	"/media/logo/hotel-vic.webp": [225, 225],
	"/media/logo/jada-events.webp": [340, 148],
	"/media/logo/mcdonalds.webp": [400, 391],
	"/media/logo/rtl.webp": [400, 225],
	"/media/logo/sea-life.webp": [400, 206],
	"/media/video/dreamhack-interactieve-vloer-poster.webp": [1280, 726],
	"/media/video/hologram-displays-poster.webp": [1280, 720]
};
//#endregion
//#region src/components/ui/Beeld.tsx
function Beeld({ src, alt, prioriteit = false, className, sizes }) {
	const maat = BEELDMATEN[src];
	return /* @__PURE__ */ jsx("img", {
		src,
		alt,
		width: maat?.[0],
		height: maat?.[1],
		loading: prioriteit ? "eager" : "lazy",
		fetchPriority: prioriteit ? "high" : void 0,
		decoding: prioriteit ? void 0 : "async",
		sizes,
		className
	});
}
//#endregion
//#region src/components/site/LogoBalk.tsx
function LogoBalk() {
	return /* @__PURE__ */ jsx("div", {
		"aria-label": "Een selectie van onze opdrachtgevers",
		role: "group",
		className: "border-y border-lijn bg-nacht/60",
		children: /* @__PURE__ */ jsx("ul", {
			className: "mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-7 md:justify-between md:px-8",
			children: KLANTLOGOS.map((logo) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Beeld, {
				src: logo.src,
				alt: logo.alt,
				className: "logo-klant h-9 w-auto max-w-[7.5rem] object-contain md:h-10"
			}) }, logo.alt))
		})
	});
}
//#endregion
//#region src/components/site/Kaarten.tsx
function ProductKaart({ product, sizes }) {
	return /* @__PURE__ */ jsxs(Link, {
		to: `/producten/${product.slug}`,
		className: "kaart group block overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors duration-200 hover:border-accent/60",
		children: [/* @__PURE__ */ jsx("div", {
			className: "kaart-beeld aspect-[4/3] overflow-hidden",
			children: /* @__PURE__ */ jsx(Beeld, {
				src: product.beeld.src,
				alt: product.beeld.alt,
				className: "h-full w-full object-cover",
				sizes
			})
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between gap-3 px-4 py-3.5",
			children: [/* @__PURE__ */ jsx("span", {
				className: "font-display text-[1rem] font-medium",
				children: product.kaartLabel ?? product.naam
			}), /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "text-accent transition-transform duration-200 group-hover:translate-x-1",
				children: "→"
			})]
		})]
	});
}
function ProjectKaart({ project, sizes }) {
	return /* @__PURE__ */ jsxs(Link, {
		to: `/projecten/${project.slug}`,
		className: "kaart group block overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors duration-200 hover:border-accent/60",
		children: [/* @__PURE__ */ jsx("div", {
			className: "kaart-beeld aspect-[3/2] overflow-hidden",
			children: /* @__PURE__ */ jsx(Beeld, {
				src: project.beeld.src,
				alt: project.beeld.alt,
				className: "h-full w-full object-cover",
				sizes
			})
		}), /* @__PURE__ */ jsxs("div", {
			className: "px-4 py-4",
			children: [/* @__PURE__ */ jsx("p", {
				className: "kicker !text-[0.7rem]",
				children: project.klant
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1.5 font-display text-[1.05rem] font-medium leading-snug",
				children: project.titel
			})]
		})]
	});
}
function SectorKaart({ sector }) {
	return /* @__PURE__ */ jsxs(Link, {
		to: `/toepassingen/${sector.slug}`,
		className: "kaart group block overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors duration-200 hover:border-accent/60",
		children: [/* @__PURE__ */ jsx("div", {
			className: "kaart-beeld aspect-[16/9] overflow-hidden",
			children: /* @__PURE__ */ jsx(Beeld, {
				src: sector.beeld.src,
				alt: sector.beeld.alt,
				className: "h-full w-full object-cover"
			})
		}), /* @__PURE__ */ jsxs("div", {
			className: "px-4 py-4",
			children: [/* @__PURE__ */ jsx("p", {
				className: "font-display text-[1.1rem] font-medium",
				children: sector.naam
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1.5 line-clamp-2 text-[0.92rem] leading-relaxed text-zacht",
				children: sector.intro
			})]
		})]
	});
}
//#endregion
//#region src/components/site/CtaSectie.tsx
function CtaSectie({ kop = "Klaar om uw ruimte te laten reageren?", tekst = `Bespreek uw idee met ons team of vraag de actuele prijslijst aan. Bellen kan direct: ${SITE.telefoon.algemeen.label}.`, primair = {
	label: "Bespreek uw project",
	naar: "/contact"
}, secundair = {
	label: "Prijslijst aanvragen",
	naar: "/prijslijst"
} }) {
	return /* @__PURE__ */ jsx("section", {
		className: "border-t border-lijn bg-nacht",
		children: /* @__PURE__ */ jsx("div", {
			className: "mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-24",
			children: /* @__PURE__ */ jsxs(Reveal, {
				className: "max-w-2xl",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-3xl font-medium md:text-4xl",
						children: kop
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 text-lg leading-relaxed text-zacht",
						children: tekst
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-8 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(Knop, {
							naar: primair.naar,
							children: primair.label
						}), /* @__PURE__ */ jsx(Knop, {
							naar: secundair.naar,
							variant: "secundair",
							children: secundair.label
						})]
					})
				]
			})
		})
	});
}
//#endregion
//#region src/pages/Home.tsx
var UITGELICHT_PROJECT = [
	"werken-bij-defensie",
	"escher-museum",
	"clinique",
	"outlet-store-roermond"
];
var WERKWIJZE = [
	{
		stap: "01",
		kop: "Concept & advies",
		tekst: "We beginnen bij uw doel, niet bij een apparaat. Samen bepalen we welke technologie uw verhaal het best vertelt."
	},
	{
		stap: "02",
		kop: "Content & studio",
		tekst: "Onze eigen studio ontwerpt de animaties, spellen en presentaties, volledig in uw huisstijl."
	},
	{
		stap: "03",
		kop: "Installatie & integratie",
		tekst: "Ons installatieteam bouwt op, stelt af en integreert de oplossing in uw ruimte of stand."
	},
	{
		stap: "04",
		kop: "Service & onderhoud",
		tekst: "Van preventief onderhoud tot een volledige SLA: we houden uw installatie draaiend."
	}
];
function Home() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("section", {
			className: "relative min-h-[82svh] overflow-hidden",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "absolute inset-0",
					children: /* @__PURE__ */ jsx(HeroVideo, {
						src: "/media/video/dreamhack-interactieve-vloer.mp4",
						poster: "/media/video/dreamhack-interactieve-vloer-poster.webp",
						label: "Interactieve vloer van Vision2Watch in actie op DreamHack, Rotterdam Ahoy",
						className: "h-full"
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: "absolute inset-0 bg-gradient-to-t from-inkt via-inkt/55 to-inkt/25",
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative mx-auto flex min-h-[82svh] w-full max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24",
					children: [
						/* @__PURE__ */ jsxs("h1", {
							className: "max-w-3xl text-4xl font-medium leading-[1.08] md:text-6xl",
							children: [
								"Wij maken ruimtes die ",
								/* @__PURE__ */ jsx("span", {
									className: "text-accent",
									children: "reageren"
								}),
								" op mensen"
							]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-6 max-w-2xl text-lg leading-relaxed text-tekst/90 md:text-xl",
							children: "Vision2Watch levert en bouwt interactieve audiovisuele oplossingen: hologrammen, interactieve vloeren en etalages, projectie en LED. Van concept en content tot installatie en service, te koop en te huur."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-9 flex flex-wrap gap-3",
							children: [/* @__PURE__ */ jsx(Knop, {
								naar: "/producten",
								children: "Ontdek de mogelijkheden"
							}), /* @__PURE__ */ jsx(Knop, {
								naar: "/projecten",
								variant: "secundair",
								children: "Bekijk projecten"
							})]
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsx(LogoBalk, {}),
		/* @__PURE__ */ jsx(Sectie, {
			kicker: "Wat we doen",
			kop: "Technologie, experience, content en integratie uit één hand",
			lead: "Sinds 2008 combineren we kennis van marketing, audio en visuals tot oplossingen die opvallen én werken. Met eigen interactieve software, een eigen contentstudio en een team dat installeert en onderhoudt.",
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-12 grid gap-4 md:grid-cols-2",
				children: CATEGORIEEN.map((cat, i) => {
					const eerste = PRODUCTEN.find((p) => p.categorie === cat.slug);
					return /* @__PURE__ */ jsx(Reveal, {
						vertraging: i * 70,
						children: /* @__PURE__ */ jsxs(Link, {
							to: `/producten#${cat.slug}`,
							className: "kaart group flex h-full flex-col overflow-hidden rounded-kaart border border-lijn bg-nacht transition-colors hover:border-accent/60",
							children: [eerste && /* @__PURE__ */ jsx("div", {
								className: "kaart-beeld aspect-[16/8] overflow-hidden",
								children: /* @__PURE__ */ jsx(Beeld, {
									src: eerste.beeld.src,
									alt: eerste.beeld.alt,
									className: "h-full w-full object-cover",
									sizes: "(min-width: 768px) 50vw, 100vw"
								})
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex flex-1 flex-col p-6",
								children: [
									/* @__PURE__ */ jsx("h3", {
										className: "font-display text-xl font-medium",
										children: cat.naam
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 flex-1 leading-relaxed text-zacht",
										children: cat.omschrijving
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-4 font-display text-[0.9rem] font-medium text-accent",
										children: ["Bekijk producten ", /* @__PURE__ */ jsx("span", {
											"aria-hidden": "true",
											className: "inline-block transition-transform duration-200 group-hover:translate-x-1",
											children: "→"
										})]
									})
								]
							})]
						})
					}, cat.slug);
				})
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Voor wie",
				kop: "Van beursvloer tot museumzaal",
				lead: "Elke omgeving vraagt een eigen aanpak. Bekijk per sector wat werkt, met echte projecten als bewijs.",
				className: "!py-20 md:!py-24",
				children: /* @__PURE__ */ jsx("ul", {
					className: "mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
					children: SECTOREN.map((s, i) => /* @__PURE__ */ jsx(Reveal, {
						as: "li",
						vertraging: i * 50,
						children: /* @__PURE__ */ jsxs(Link, {
							to: `/toepassingen/${s.slug}`,
							className: "group flex items-center justify-between gap-3 rounded-kaart border border-lijn bg-inkt px-5 py-4 transition-colors hover:border-accent/60",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-display text-[1.05rem] font-medium",
								children: s.naam
							}), /* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								className: "text-accent transition-transform duration-200 group-hover:translate-x-1",
								children: "→"
							})]
						})
					}, s.slug))
				})
			})
		}),
		/* @__PURE__ */ jsxs(Sectie, {
			kicker: "Ons werk",
			kop: "Projecten die bezoekers zich herinneren",
			lead: "Van een gamevloer voor Defensie op DreamHack tot een interactieve bar voor Clinique: dit is hoe onze technologie in de praktijk werkt.",
			children: [/* @__PURE__ */ jsx("div", {
				className: "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: UITGELICHT_PROJECT.map((slug, i) => {
					const p = PROJECTEN.find((x) => x.slug === slug);
					if (!p) return null;
					return /* @__PURE__ */ jsx(Reveal, {
						vertraging: i * 70,
						children: /* @__PURE__ */ jsx(ProjectKaart, {
							project: p,
							sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
						})
					}, slug);
				})
			}), /* @__PURE__ */ jsx(Reveal, {
				className: "mt-8",
				children: /* @__PURE__ */ jsx(Knop, {
					naar: "/projecten",
					variant: "secundair",
					children: "Alle projecten"
				})
			})]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn",
			children: /* @__PURE__ */ jsxs(Sectie, {
				kicker: "Hoe we werken",
				kop: "Eén partner, het hele traject",
				lead: "Geen doorverwijzingen tussen leveranciers: advies, content, installatie en service komen bij Vision2Watch uit hetzelfde team.",
				children: [/* @__PURE__ */ jsx("ol", {
					className: "mt-12 grid gap-8 md:grid-cols-4",
					children: WERKWIJZE.map((w, i) => /* @__PURE__ */ jsxs(Reveal, {
						as: "li",
						vertraging: i * 70,
						className: "border-t border-lijn pt-5",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "font-display text-[0.85rem] font-medium text-accent",
								children: w.stap
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "mt-2 font-display text-lg font-medium",
								children: w.kop
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-[0.95rem] leading-relaxed text-zacht",
								children: w.tekst
							})
						]
					}, w.stap))
				}), /* @__PURE__ */ jsx(Reveal, {
					className: "mt-10",
					children: /* @__PURE__ */ jsx(Knop, {
						naar: "/diensten",
						variant: "secundair",
						children: "Meer over onze diensten"
					})
				})]
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28",
				children: [/* @__PURE__ */ jsxs(Reveal, { children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: "Showroom Den Haag"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-3xl font-medium md:text-[2.6rem] md:leading-[1.1]",
						children: "Zien is geloven: ervaar het zelf in onze showroom"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: "In onze showroom demonstreren we vrijwel alle oplossingen, inclusief een holografisch scherm van 9 meter, het langste van Nederland. Plan een bezoek en ontdek wat werkt voor uw ruimte."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-8 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(Knop, {
							naar: "/contact",
							children: "Plan een bezoek"
						}), /* @__PURE__ */ jsxs(Knop, {
							naar: `tel:${SITE.telefoon.algemeen.tel}`,
							variant: "secundair",
							children: ["Bel ", SITE.telefoon.algemeen.label]
						})]
					})
				] }), /* @__PURE__ */ jsx(Reveal, {
					vertraging: 100,
					className: "overflow-hidden rounded-kaart border border-lijn",
					children: /* @__PURE__ */ jsx(Beeld, {
						src: "/media/hologram-groep-podium.webp",
						alt: "Levensgrote hologram-projectie van personen",
						className: "h-full w-full object-cover",
						sizes: "(min-width: 768px) 50vw, 100vw"
					})
				})]
			})
		}),
		/* @__PURE__ */ jsx(CtaSectie, {})
	] });
}
//#endregion
//#region src/components/site/Kruimelpad.tsx
function Kruimelpad({ items }) {
	return /* @__PURE__ */ jsx("nav", {
		"aria-label": "Kruimelpad",
		className: "text-[0.85rem] text-dof",
		children: /* @__PURE__ */ jsxs("ol", {
			className: "flex flex-wrap items-center gap-1.5",
			children: [/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
				to: "/",
				className: "transition-colors hover:text-zacht",
				children: "Home"
			}) }), items.map((item) => /* @__PURE__ */ jsxs("li", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: "/"
				}), item.pad ? /* @__PURE__ */ jsx(Link, {
					to: item.pad,
					className: "transition-colors hover:text-zacht",
					children: item.naam
				}) : /* @__PURE__ */ jsx("span", {
					"aria-current": "page",
					className: "text-zacht",
					children: item.naam
				})]
			}, item.naam))]
		})
	});
}
//#endregion
//#region src/pages/Producten.tsx
function Producten() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
			children: [
				/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Producten" }] }),
				/* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl pb-4 pt-10 md:pt-14",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "kicker mb-3",
							children: "Producten"
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "text-4xl font-medium leading-[1.1] md:text-5xl",
							children: "Interactieve technologie, te koop en te huur"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-5 text-lg leading-relaxed text-zacht",
							children: "Alle oplossingen leveren we compleet: hardware, eigen software, content in uw huisstijl, installatie en service. Kies een categorie of blader door het volledige aanbod."
						})
					]
				}),
				/* @__PURE__ */ jsx("nav", {
					"aria-label": "Categorieën",
					className: "flex flex-wrap gap-2 pb-6 pt-2",
					children: CATEGORIEEN.map((c) => /* @__PURE__ */ jsx("a", {
						href: `#${c.slug}`,
						className: "rounded-full border border-lijn px-4 py-2 text-[0.9rem] text-zacht transition-colors hover:border-accent hover:text-accent",
						children: c.naam
					}, c.slug))
				})
			]
		}),
		CATEGORIEEN.map((cat) => {
			const items = PRODUCTEN.filter((p) => p.categorie === cat.slug);
			return /* @__PURE__ */ jsx("section", {
				id: cat.slug,
				className: "scroll-mt-24 border-t border-lijn",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20",
					children: [/* @__PURE__ */ jsxs(Reveal, {
						className: "max-w-3xl",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-medium md:text-3xl",
							children: cat.naam
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-3 leading-relaxed text-zacht",
							children: cat.omschrijving
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: items.map((p, i) => /* @__PURE__ */ jsx(Reveal, {
							vertraging: i * 50,
							children: /* @__PURE__ */ jsx(ProductKaart, {
								product: p,
								sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
							})
						}, p.slug))
					})]
				})
			}, cat.slug);
		}),
		/* @__PURE__ */ jsx(CtaSectie, {
			kop: "Niet zeker welke oplossing past?",
			tekst: "Vertel ons wat u wilt bereiken; wij adviseren welke technologie daarbij hoort. Of vraag de prijslijst aan voor het complete overzicht."
		})
	] });
}
//#endregion
//#region src/content/nl/kennisbank.ts
var ARTIKELEN = [
	{
		slug: "wat-is-een-interactieve-vloer",
		titel: "Wat is een interactieve vloer en hoe werkt hij? | Vision2Watch",
		kop: "Wat is een interactieve vloer en hoe werkt hij?",
		description: "Een interactieve vloer projecteert beelden die reageren op beweging. Lees hoe de techniek werkt, wat erbij komt kijken en waar hij het best tot zijn recht komt.",
		gepubliceerd: "2026-08-20",
		gewijzigd: "2026-08-20",
		antwoord: "Een interactieve vloer is een projectie op de vloer die direct reageert op beweging: water dat rimpelt onder je voeten, een bal die je kunt trappen of een logo dat meespeelt met elke stap. Een projector levert het beeld, een infraroodcamera registreert beweging en software vertaalt die beweging live naar effecten in de projectie.",
		secties: [
			{
				kop: "De techniek in het kort",
				alineas: ["Een interactieve vloer bestaat uit drie onderdelen: een projector, een infraroodcamera en interactieve software. De projector hangt meestal aan het plafond of staat aan de zijkant en projecteert het beeld op de vloer. De infraroodcamera kijkt naar hetzelfde vlak en registreert waar mensen staan en bewegen, onafhankelijk van het geprojecteerde beeld.", "De software combineert beide: elke geregistreerde beweging wordt direct vertaald naar een reactie in de projectie. Vision2Watch gebruikt hiervoor zelfontwikkelde iFloor-software, waardoor de gevoeligheid instelbaar is op het omgevingslicht en content snel is aan te passen aan een huisstijl of campagne."]
			},
			{
				kop: "Vast of mobiel",
				alineas: ["Voor permanente opstellingen, bijvoorbeeld in een museum of dierenpark, wordt de projector vast gemonteerd en onopvallend weggewerkt. Voor beurzen en events bestaat er een mobiele variant: samen met Epson ontwikkelde Vision2Watch een draagbaar iFloor-systeem met een compacte behuizing en een groot projectievlak, dat ook bij beperkte ruimte en hoogte snel staat."]
			},
			{
				kop: "Waar wordt een interactieve vloer gebruikt?",
				alineas: ["De vloer komt overal tot zijn recht waar mensen langslopen en mogen blijven hangen: beursstands, showrooms, musea, dierenparken, scholen, hotels en winkelstraten. Voorbeelden uit onze eigen praktijk: een gamevloer voor Werken bij Defensie op DreamHack, een permanente waterwereld bij Ouwehands Dierenpark en een bloemenvloer voor het jubileum van Euroveiling."]
			},
			{
				kop: "Wat bepaalt de kwaliteit?",
				alineas: ["Drie dingen maken het verschil: de nauwkeurigheid van de bewegingsdetectie (en of die is afgesteld op het licht in de ruimte), de kwaliteit van de content en de plaatsing van de projector. Daarom hoort bij een goede interactieve vloer altijd een intake van de locatie, content op maat en een zorgvuldige afstelling op locatie."]
			}
		],
		faq: [{
			vraag: "Werkt een interactieve vloer op elke ondergrond?",
			antwoord: "Op vrijwel elke lichte, matte ondergrond. Bij donkere of sterk spiegelende vloeren wordt een projectiedoek of lichte vloerbedekking gebruikt; dat bekijken we tijdens de intake."
		}, {
			vraag: "Hoeveel mensen kunnen tegelijk op de vloer spelen?",
			antwoord: "De detectie registreert meerdere personen tegelijk; groepjes spelers zijn juist het normale gebruik, bijvoorbeeld op een beurs of schoolplein."
		}],
		verwantProduct: ["interactieve-vloer", "interactieve-muur"]
	},
	{
		slug: "interactieve-vloer-kopen-of-huren",
		titel: "Interactieve vloer kopen of huren: hoe kiest u? | Vision2Watch",
		kop: "Interactieve vloer kopen of huren: hoe kiest u?",
		description: "Huren is logisch voor één event, kopen loont bij herhaald gebruik. Lees welke afweging past bij uw situatie en wat er bij beide opties is inbegrepen.",
		gepubliceerd: "2026-08-20",
		gewijzigd: "2026-08-20",
		antwoord: "Huur een interactieve vloer als u hem eenmalig of incidenteel inzet, bijvoorbeeld voor één beurs: u betaalt per event en opbouw, afstelling en afbouw zijn geregeld. Kopen loont zodra u de vloer vaker gebruikt: bij aankoop zet u het systeem onbeperkt opnieuw in, zonder extra kosten, met telkens nieuwe content.",
		secties: [
			{
				kop: "Wanneer is huren logisch?",
				alineas: ["Voor een eenmalige beursdeelname, productlancering of themaweek is huren de eenvoudigste route. Vision2Watch levert de vloer inclusief transport, opbouw, afstelling en afbouw, en maakt de content passend bij uw campagne. Na het event nemen wij alles weer mee."]
			},
			{
				kop: "Wanneer loont kopen?",
				alineas: ["Zet u de vloer meerdere keren per jaar in, of permanent op één locatie, dan is kopen voordeliger. Bij aankoop is het systeem onbeperkt herbruikbaar zonder extra kosten; alleen nieuwe content is een investering wanneer u die wilt. Vaste installaties combineren we met een onderhoudsafspraak, van periodieke controle tot een volledige serviceovereenkomst (SLA)."]
			},
			{
				kop: "Wat kost een interactieve vloer?",
				alineas: ["De prijs hangt af van het formaat van het projectievlak, vast of mobiel gebruik, de gewenste content en de huurperiode of koopconfiguratie. Daarom werken we met een actuele prijslijst en een advies op maat: vraag de prijslijst aan en u weet binnen één gesprek waar u aan toe bent."]
			}
		],
		faq: [{
			vraag: "Is de content bij huur inbegrepen?",
			antwoord: "Bij elke huuropdracht hoort content die past bij uw event; volledig maatwerk in uw huisstijl stemmen we vooraf af. Bij aankoop maakt onze studio content die u daarna onbeperkt gebruikt."
		}, {
			vraag: "Kan ik eerst een demonstratie krijgen?",
			antwoord: "Ja. In onze showroom demonstreren we vrijwel alle oplossingen; maak een afspraak en ervaar de vloer zelf voordat u kiest."
		}],
		verwantProduct: ["interactieve-vloer"]
	},
	{
		slug: "wat-is-hologram-projectie",
		titel: "Wat is hologram-projectie? Pepper's Ghost uitgelegd | Vision2Watch",
		kop: "Wat is hologram-projectie en hoe werkt Pepper's Ghost?",
		description: "Hologram-projectie laat personen en producten levensecht zweven met het Pepper's Ghost-principe. Lees hoe de illusie werkt en wat er in de praktijk mogelijk is.",
		gepubliceerd: "2026-08-20",
		gewijzigd: "2026-08-20",
		antwoord: "Hologram-projectie toont personen of objecten als zwevend beeld op ware grootte, via een speciaal transparant scherm en verborgen projectoren. De techniek is gebaseerd op het Pepper's Ghost-principe: een deel van het projectorlicht wordt door een transparante folie opgevangen, waardoor de illusie ontstaat dat er werkelijk iemand of iets staat.",
		secties: [
			{
				kop: "Een illusie van 150 jaar oud, met moderne techniek",
				alineas: ["Pepper's Ghost wordt al meer dan 150 jaar gebruikt in theater, films en attracties, van het Spookslot in de Efteling tot Disney's Haunted Mansion. In de muziekindustrie verschenen artiesten als Tupac en Elvis Presley er postuum mee op het podium.", "De moderne uitvoering werkt met een strak gespannen transparante folie en krachtige projectoren op een voor het publiek onzichtbare plek, vaak onder de vloer. Het geprojecteerde beeld weerkaatst deels in de folie en lijkt daardoor vrij in de ruimte te staan, levensgroot en met hoge resolutie."]
			},
			{
				kop: "Wat kan er in de praktijk?",
				alineas: ["Personen kunnen opgenomen of live als hologram verschijnen, producten kunnen zwevend draaien en presentaties kunnen interactief worden gemaakt met touchbediening, bijvoorbeeld voor een 360-gradenweergave. Naast maatwerkprojecties bestaan er kant-en-klare varianten zoals de holobox van ons zusterbedrijf HEREweHOLO en holografische molens die beelden met LED in de lucht laten zweven."]
			},
			{
				kop: "Zelf ervaren",
				alineas: ["Een hologram moet je zien om het te geloven. In de showroom van Vision2Watch staat een holografisch scherm van 9 meter, het langste van Nederland, waarop we het effect demonstreren, inclusief speciaal geproduceerde content zoals de video voor het Escher Museum."]
			}
		],
		faq: [{
			vraag: "Is een hologram ook bij daglicht zichtbaar?",
			antwoord: "Pepper's Ghost-projecties komen het best tot hun recht in een gecontroleerde lichtomgeving; voor lichte ruimtes en etalages zijn holografische molens met krachtige LED's het geschikte alternatief."
		}, {
			vraag: "Kan een spreker live als hologram op een congres verschijnen?",
			antwoord: "Ja. Naast opgenomen presentaties is live weergave op ware grootte mogelijk, zodat een spreker aanwezig lijkt zonder te reizen."
		}],
		verwantProduct: [
			"hologram-projectie",
			"hereweholo",
			"holografische-molen"
		]
	},
	{
		slug: "hoe-werkt-een-interactieve-etalage",
		titel: "Hoe werkt een interactieve etalage (touch foil)? | Vision2Watch",
		kop: "Hoe werkt een interactieve etalage met touch foil?",
		description: "Een transparante folie maakt uw etalageruit bedienbaar met de hand, ook door het glas. Lees hoe projected capacitance werkt en wat een interactieve etalage kan.",
		gepubliceerd: "2026-08-20",
		gewijzigd: "2026-08-20",
		antwoord: "Een interactieve etalage gebruikt een transparante touch foil aan de binnenzijde van de ruit. In de folie zit een vrijwel onzichtbaar raster van draden dat via projected capacitance detecteert waar iemand het glas aan de buitenkant aanraakt. Gecombineerd met een scherm of projectie achter het glas wordt de ruit zo een bedienbaar medium dat 24 uur per dag werkt.",
		secties: [{
			kop: "De techniek: projected capacitance",
			alineas: ["De touch foil is een dunne kunststoffolie met een raster van geleidende draden, aangesloten op een controller. Raakt iemand het glas aan, dan verandert het spanningsveld op die plek en registreert de controller de aanraking, door het glas heen. Dezelfde technologie zit in smartphoneschermen, hier uitgevoerd op etalageformaat.", "Achter het glas zorgt een projectiescherm, LCD of LED voor het beeld. De juiste keuze hangt af van lichtinval, formaat en gewenste beeldkwaliteit; opties zoals through-glass speakers en bewegingsdetectie maken de ervaring compleet."]
		}, {
			kop: "Wat heb je eraan?",
			alineas: ["De etalage verandert van statisch uithangbord in een kanaal dat blijft werken als de winkel dicht is: passanten bladeren door de collectie, bekijken acties of spelen met uw merk. Bewegingsdetectie kan content starten zodra iemand langsloopt, zoals wij deden bij de interactieve etalages voor Outlet Roermond, waar passanten in astronauten veranderden."]
		}],
		faq: [{
			vraag: "Werkt touch foil ook op dik of gelaagd glas?",
			antwoord: "Ja, touch foil werkt door gangbaar etalageglas heen. Bij bijzondere beglazing testen we de werking vooraf op locatie."
		}, {
			vraag: "Wat is er buiten aan de gevel te zien van de techniek?",
			antwoord: "Niets. Alle techniek zit aan de binnenzijde: de folie is transparant en het beeld komt van binnenuit. De gevel blijft onaangetast."
		}],
		verwantProduct: [
			"interactieve-etalage",
			"touchscreens",
			"transparant-scherm"
		]
	},
	{
		slug: "opvallen-op-een-beurs",
		titel: "Opvallen op een beurs: zo werkt interactieve technologie | Vision2Watch",
		kop: "Opvallen op een beurs: zo zet u interactieve technologie in",
		description: "Bezoekers lopen in seconden voorbij. Vijf bewezen manieren uit onze eigen beurspraktijk om ze te laten stoppen, meedoen en uw verhaal te onthouden.",
		gepubliceerd: "2026-08-20",
		gewijzigd: "2026-08-20",
		antwoord: "Op een beurs stopt een bezoeker alleen voor iets dat beweegt, reageert of uitnodigt om mee te doen. Interactieve technologie doet precies dat: een vloer waarop je speelt, een hologram dat uw product laat zweven of een virtuele host die iedereen aanspreekt maakt van uw stand het gesprek van de beursvloer.",
		secties: [
			{
				kop: "1. Maak het gangpad onderdeel van uw stand",
				alineas: ["Een interactieve vloer of een interactief looppad trekt bezoekers letterlijk uw kant op: wie eroverheen loopt, doet al mee. Voor Kanon Loading Equipment bouwden we op StocExpo een interactief tussenpad; voor Werken bij Defensie een gamevloer midden op DreamHack."]
			},
			{
				kop: "2. Laat het product het werk doen",
				alineas: ["Producten die te groot, te klein of te kostbaar zijn voor de stand, presenteert u als hologram: levensgroot, zwevend en van alle kanten te bekijken. Een interactieve bar of tafel koppelt het echte product aan digitale uitleg, zoals bij de lancering van het Clinique glow serum, waar het oppakken van een flesje de projectie startte."]
			},
			{
				kop: "3. Spreek elke passant aan",
				alineas: ["Standbemanning is schaars op piekmomenten. De Virtual Host spreekt passanten automatisch aan zodra ze naderen en vertelt uw kernverhaal, 24 uur per dag hetzelfde en altijd met evenveel energie."]
			},
			{
				kop: "4. Laat bezoekers iets doen, niet alleen kijken",
				alineas: ["Meedoen onthoudt beter dan kijken. Spellen op vloer of wand, een tekening die tot leven komt of een AR-scherm waarin passanten zichzelf terugzien: interactie geeft bezoekers een reden om te blijven, en uw team een natuurlijk gespreksbegin."]
			},
			{
				kop: "5. Regel de logistiek weg",
				alineas: ["Beurstijd is kort: kies systemen die snel staan. Ons draagbare iFloor-systeem staat ook bij beperkte ruimte en hoogte, en huur is inclusief opbouw, afstelling en afbouw, zodat uw team zich met bezoekers bezighoudt in plaats van met techniek."]
			}
		],
		faq: [{
			vraag: "Wat is de beste plek voor interactieve technologie op een stand?",
			antwoord: "Aan de rand, gericht op het gangpad: daar loopt uw publiek. De interactie trekt bezoekers de stand in, waar uw team het gesprek overneemt."
		}, {
			vraag: "Hoe ver van tevoren moet ik reserveren voor een beurs?",
			antwoord: "Hoe eerder, hoe beter, zeker als er maatwerkcontent bij hoort. Neem contact op met de beursdatum en wij plannen productie en opbouw er naartoe."
		}],
		verwantProduct: [
			"interactieve-vloer",
			"hologram-projectie",
			"virtual-host"
		]
	}
];
var vindArtikel = (slug) => ARTIKELEN.find((a) => a.slug === slug);
//#endregion
//#region src/components/site/FaqLijst.tsx
function FaqLijst({ items }) {
	return /* @__PURE__ */ jsx("div", {
		className: "divide-y divide-lijn border-y border-lijn",
		children: items.map((f) => /* @__PURE__ */ jsxs("details", {
			className: "group py-1",
			children: [/* @__PURE__ */ jsxs("summary", {
				className: "flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[1.05rem] font-medium [&::-webkit-details-marker]:hidden",
				children: [f.vraag, /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: "shrink-0 text-accent transition-transform duration-300 group-open:rotate-45",
					children: "+"
				})]
			}), /* @__PURE__ */ jsx("p", {
				className: "max-w-3xl pb-5 leading-relaxed text-zacht",
				children: f.antwoord
			})]
		}, f.vraag))
	});
}
//#endregion
//#region src/pages/NietGevonden.tsx
function NietGevonden() {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto flex w-full max-w-6xl flex-col items-start px-5 py-24 md:px-8 md:py-32",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "kicker mb-3",
				children: "404"
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "text-4xl font-medium leading-[1.1] md:text-5xl",
				children: "Deze pagina bestaat niet (meer)"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-5 max-w-xl text-lg leading-relaxed text-zacht",
				children: "Het adres klopt niet of de pagina is verplaatst. Via onderstaande knoppen vindt u snel wat u zoekt."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-9 flex flex-wrap gap-3",
				children: [
					/* @__PURE__ */ jsx(Knop, {
						naar: "/producten",
						children: "Bekijk producten"
					}),
					/* @__PURE__ */ jsx(Knop, {
						naar: "/projecten",
						variant: "secundair",
						children: "Bekijk projecten"
					}),
					/* @__PURE__ */ jsx(Knop, {
						naar: "/contact",
						variant: "secundair",
						children: "Contact"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/pages/ProductDetail.tsx
function ProductDetail() {
	const { slug } = useParams();
	const product = slug ? vindProduct(slug) : void 0;
	if (!product) return /* @__PURE__ */ jsx(NietGevonden, {});
	const projecten = product.projecten.map((s) => PROJECTEN.find((p) => p.slug === s)).filter(Boolean);
	const verwant = product.verwant.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
			children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{
				naam: "Producten",
				pad: "/producten"
			}, { naam: product.naam }] }), /* @__PURE__ */ jsxs("div", {
				className: "grid items-center gap-10 py-10 md:grid-cols-2 md:py-16",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("h1", {
						className: "text-4xl font-medium leading-[1.1] md:text-5xl",
						children: product.naam
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: product.intro
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-8 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(Knop, {
							naar: "/prijslijst",
							children: "Prijslijst aanvragen"
						}), /* @__PURE__ */ jsx(Knop, {
							naar: "/contact",
							variant: "secundair",
							children: "Demonstratie aanvragen"
						})]
					})
				] }), /* @__PURE__ */ jsx(Reveal, {
					vertraging: 80,
					className: "overflow-hidden rounded-kaart border border-lijn",
					children: /* @__PURE__ */ jsx(Beeld, {
						src: product.beeld.src,
						alt: product.beeld.alt,
						prioriteit: true,
						className: "aspect-[4/3] w-full object-cover",
						sizes: "(min-width: 768px) 50vw, 100vw"
					})
				})]
			})]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx("div", {
				className: "mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20",
				children: /* @__PURE__ */ jsxs(Reveal, {
					className: "max-w-3xl",
					children: [/* @__PURE__ */ jsxs("p", {
						className: "kicker mb-3",
						children: ["Waarom ", product.kaartLabel?.toLowerCase() ?? product.naam.toLowerCase()]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xl leading-relaxed md:text-2xl md:leading-relaxed",
						children: product.waarom
					})]
				})
			})
		}),
		product.video && /* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 pt-14 md:px-8",
			children: [/* @__PURE__ */ jsx(Reveal, {
				className: "overflow-hidden rounded-kaart border border-lijn",
				children: /* @__PURE__ */ jsx(HeroVideo, {
					src: product.video.src,
					poster: product.video.poster,
					label: product.video.label,
					className: "aspect-video"
				})
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-3 text-[0.85rem] text-dof",
				children: product.video.label
			})]
		}),
		/* @__PURE__ */ jsx(Sectie, {
			kicker: "Voordelen",
			kop: `Dit maakt de ${(product.kaartLabel ?? product.naam).toLowerCase()} sterk`,
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2",
				children: product.voordelen.map((v, i) => /* @__PURE__ */ jsxs(Reveal, {
					vertraging: i * 60,
					className: "border-t border-lijn pt-5",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "font-display text-lg font-medium",
						children: v.kop
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-2 leading-relaxed text-zacht",
						children: v.tekst
					})]
				}, v.kop))
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1fr_1.4fr] md:px-8 md:py-24",
				children: [/* @__PURE__ */ jsxs(Reveal, { children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-2xl font-medium md:text-3xl",
						children: "Toepassingen"
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-6 flex flex-wrap gap-2",
						children: product.toepassingen.map((t) => /* @__PURE__ */ jsx("li", {
							className: "rounded-full border border-lijn px-4 py-2 text-[0.9rem] text-zacht",
							children: t
						}, t))
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-8",
						children: /* @__PURE__ */ jsx(Knop, {
							naar: "/toepassingen",
							variant: "secundair",
							children: "Bekijk toepassingen per sector"
						})
					})
				] }), /* @__PURE__ */ jsxs(Reveal, {
					vertraging: 80,
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-medium md:text-3xl",
							children: "Techniek & integratie"
						}),
						/* @__PURE__ */ jsx("dl", {
							className: "mt-6 divide-y divide-lijn border-y border-lijn",
							children: product.technisch.map((t) => /* @__PURE__ */ jsxs("div", {
								className: "grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6",
								children: [/* @__PURE__ */ jsx("dt", {
									className: "font-display text-[0.95rem] font-medium text-tekst",
									children: t.kop
								}), /* @__PURE__ */ jsx("dd", {
									className: "text-[0.95rem] leading-relaxed text-zacht",
									children: t.tekst
								})]
							}, t.kop))
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-6 leading-relaxed text-zacht",
							children: product.levering
						})
					]
				})]
			})
		}),
		product.galerij && product.galerij.length > 0 && /* @__PURE__ */ jsx(Sectie, {
			kicker: "In de praktijk",
			kop: "Zo ziet het eruit",
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: product.galerij.map((b, i) => /* @__PURE__ */ jsx(Reveal, {
					vertraging: i * 60,
					className: "overflow-hidden rounded-kaart border border-lijn",
					children: /* @__PURE__ */ jsx(Beeld, {
						src: b.src,
						alt: b.alt,
						className: "aspect-[4/3] w-full object-cover",
						sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					})
				}, b.src))
			})
		}),
		projecten.length > 0 && /* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Bewijs",
				kop: "Projecten met deze oplossing",
				children: /* @__PURE__ */ jsx("div", {
					className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: projecten.slice(0, 3).map((p, i) => /* @__PURE__ */ jsx(Reveal, {
						vertraging: i * 60,
						children: /* @__PURE__ */ jsx(ProjectKaart, {
							project: p,
							sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
						})
					}, p.slug))
				})
			})
		}),
		/* @__PURE__ */ jsxs(Sectie, {
			kicker: "Veelgestelde vragen",
			kop: `Vragen over de ${(product.kaartLabel ?? product.naam).toLowerCase()}`,
			children: [/* @__PURE__ */ jsx("div", {
				className: "mt-10 max-w-3xl",
				children: /* @__PURE__ */ jsx(FaqLijst, { items: product.faq })
			}), (() => {
				const artikelen = ARTIKELEN.filter((a) => a.verwantProduct.includes(product.slug));
				if (!artikelen.length) return null;
				return /* @__PURE__ */ jsxs("div", {
					className: "mt-10 max-w-3xl",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
						children: "Verder lezen in de kennisbank"
					}), /* @__PURE__ */ jsx("ul", {
						className: "mt-3 space-y-2",
						children: artikelen.map((a) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
							to: `/kennisbank/${a.slug}`,
							className: "text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent",
							children: a.kop
						}) }, a.slug))
					})]
				});
			})()]
		}),
		verwant.length > 0 && /* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Verwante producten",
				kop: "Ook interessant",
				className: "!py-16 md:!py-20",
				children: /* @__PURE__ */ jsx("div", {
					className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: verwant.map((p) => /* @__PURE__ */ jsx(ProductKaart, {
						product: p,
						sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					}, p.slug))
				})
			})
		}),
		/* @__PURE__ */ jsx(CtaSectie, {
			kop: `${product.kaartLabel ?? product.naam} inzetten voor uw ruimte of event?`,
			tekst: "Vraag de prijslijst aan of plan een demonstratie in onze showroom in Den Haag.",
			primair: {
				label: "Prijslijst aanvragen",
				naar: "/prijslijst"
			},
			secundair: {
				label: "Demonstratie aanvragen",
				naar: "/contact"
			}
		})
	] });
}
//#endregion
//#region src/pages/Toepassingen.tsx
function Toepassingen() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
		className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
		children: [
			/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Toepassingen" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl pb-10 pt-10 md:pt-14",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: "Toepassingen"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-4xl font-medium leading-[1.1] md:text-5xl",
						children: "Wat werkt waar?"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: "Elke omgeving heeft zijn eigen dynamiek: een beursbezoeker beslist in seconden, een museumbezoeker neemt de tijd. Bekijk per sector welke technologie werkt, onderbouwd met projecten die we er echt bouwden."
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3",
				children: SECTOREN.map((s, i) => /* @__PURE__ */ jsx(Reveal, {
					vertraging: i * 60,
					children: /* @__PURE__ */ jsx(SectorKaart, { sector: s })
				}, s.slug))
			})
		]
	}), /* @__PURE__ */ jsx(CtaSectie, {
		kop: "Staat uw sector er niet tussen?",
		tekst: "De techniek is breder inzetbaar dan deze zes sectoren. Vertel ons uw situatie; wij denken mee over wat werkt."
	})] });
}
//#endregion
//#region src/pages/SectorDetail.tsx
function SectorDetail() {
	const { slug } = useParams();
	const sector = slug ? vindSector(slug) : void 0;
	if (!sector) return /* @__PURE__ */ jsx(NietGevonden, {});
	const producten = sector.producten.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);
	const projecten = sector.projecten.map((s) => PROJECTEN.find((p) => p.slug === s)).filter(Boolean);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
			children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{
				naam: "Toepassingen",
				pad: "/toepassingen"
			}, { naam: sector.naam }] }), /* @__PURE__ */ jsxs("div", {
				className: "grid items-center gap-10 py-10 md:grid-cols-2 md:py-16",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: sector.naam
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-4xl font-medium leading-[1.1] md:text-5xl",
						children: sector.naam
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: sector.intro
					})
				] }), /* @__PURE__ */ jsx(Reveal, {
					vertraging: 80,
					className: "overflow-hidden rounded-kaart border border-lijn",
					children: /* @__PURE__ */ jsx(Beeld, {
						src: sector.beeld.src,
						alt: sector.beeld.alt,
						prioriteit: true,
						className: "aspect-[16/10] w-full object-cover",
						sizes: "(min-width: 768px) 50vw, 100vw"
					})
				})]
			})]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Situaties",
				kop: `Zo zetten we technologie in voor ${sector.naam.toLowerCase()}`,
				children: /* @__PURE__ */ jsx("div", {
					className: "mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2",
					children: sector.situaties.map((s, i) => /* @__PURE__ */ jsxs(Reveal, {
						vertraging: i * 60,
						className: "border-t border-lijn pt-5",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-display text-lg font-medium",
							children: s.kop
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-2 leading-relaxed text-zacht",
							children: s.tekst
						})]
					}, s.kop))
				})
			})
		}),
		projecten.length > 0 && /* @__PURE__ */ jsx(Sectie, {
			kicker: "Bewijs",
			kop: `Projecten in ${sector.naam.toLowerCase()}`,
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: projecten.map((p, i) => /* @__PURE__ */ jsx(Reveal, {
					vertraging: i * 50,
					children: /* @__PURE__ */ jsx(ProjectKaart, {
						project: p,
						sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					})
				}, p.slug))
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Passende producten",
				kop: `Veelgekozen voor ${sector.naam.toLowerCase()}`,
				className: "!py-16 md:!py-20",
				children: /* @__PURE__ */ jsx("div", {
					className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: producten.slice(0, 6).map((p) => /* @__PURE__ */ jsx(ProductKaart, {
						product: p,
						sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					}, p.slug))
				})
			})
		}),
		sector.faq.length > 0 && /* @__PURE__ */ jsx(Sectie, {
			kicker: "Veelgestelde vragen",
			kop: `Vragen uit ${sector.naam.toLowerCase()}`,
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-10 max-w-3xl",
				children: /* @__PURE__ */ jsx(FaqLijst, { items: sector.faq })
			})
		}),
		/* @__PURE__ */ jsx(CtaSectie, {
			kop: `Een project in ${sector.naam.toLowerCase()}?`,
			tekst: "Bespreek uw locatie of event met ons team; we adviseren wat werkt en wat het kost."
		})
	] });
}
//#endregion
//#region src/pages/Projecten.tsx
function Projecten() {
	const [filter, setFilter] = useState("alles");
	const zichtbaar = filter === "alles" ? PROJECTEN : PROJECTEN.filter((p) => p.sector === filter);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
		className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
		children: [
			/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Projecten" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl pb-6 pt-10 md:pt-14",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: "Projecten"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-4xl font-medium leading-[1.1] md:text-5xl",
						children: "Ons werk in de praktijk"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: [
							"Van gamevloer op DreamHack tot Sketchwall bij Sea Life: ",
							PROJECTEN.length,
							" projecten voor musea, merken, hotels, scholen en events."
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap gap-2 pb-8",
				role: "group",
				"aria-label": "Filter projecten op sector",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => setFilter("alles"),
					"aria-pressed": filter === "alles",
					className: `rounded-full border px-4 py-2 text-[0.9rem] transition-colors ${filter === "alles" ? "border-accent text-accent" : "border-lijn text-zacht hover:border-accent/50"}`,
					children: "Alles"
				}), SECTOREN.map((s) => /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => setFilter(s.slug),
					"aria-pressed": filter === s.slug,
					className: `rounded-full border px-4 py-2 text-[0.9rem] transition-colors ${filter === s.slug ? "border-accent text-accent" : "border-lijn text-zacht hover:border-accent/50"}`,
					children: s.naam
				}, s.slug))]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3",
				children: zichtbaar.map((p, i) => /* @__PURE__ */ jsx(Reveal, {
					vertraging: i % 6 * 40,
					children: /* @__PURE__ */ jsx(ProjectKaart, {
						project: p,
						sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					})
				}, p.slug))
			})
		]
	}), /* @__PURE__ */ jsx(CtaSectie, {
		kop: "Uw project als volgende referentie?",
		tekst: "Elk project begint met één gesprek over uw doel, locatie en planning."
	})] });
}
//#endregion
//#region src/pages/ProjectDetail.tsx
function ProjectDetail() {
	const { slug } = useParams();
	const project = slug ? vindProject(slug) : void 0;
	if (!project) return /* @__PURE__ */ jsx(NietGevonden, {});
	const sector = vindSector(project.sector);
	const producten = project.producten.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);
	const meer = PROJECTEN.filter((p) => p.slug !== project.slug && p.sector === project.sector).slice(0, 3);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
			children: [
				/* @__PURE__ */ jsx(Kruimelpad, { items: [{
					naam: "Projecten",
					pad: "/projecten"
				}, { naam: project.klant }] }),
				/* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl pb-8 pt-10 md:pt-14",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "kicker mb-3",
							children: project.klant
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "text-4xl font-medium leading-[1.1] md:text-5xl",
							children: project.titel
						}),
						/* @__PURE__ */ jsxs("dl", {
							className: "mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[0.9rem] text-zacht",
							children: [
								project.locatie && /* @__PURE__ */ jsxs("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ jsx("dt", {
										className: "text-dof",
										children: "Locatie"
									}), /* @__PURE__ */ jsx("dd", { children: project.locatie })]
								}),
								sector && /* @__PURE__ */ jsxs("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ jsx("dt", {
										className: "text-dof",
										children: "Sector"
									}), /* @__PURE__ */ jsx("dd", { children: sector.naam })]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ jsx("dt", {
										className: "text-dof",
										children: "Techniek"
									}), /* @__PURE__ */ jsx("dd", { children: producten.map((p) => p.kaartLabel ?? p.naam).join(", ") })]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ jsx(Reveal, {
					className: "overflow-hidden rounded-kaart border border-lijn",
					children: project.video ? /* @__PURE__ */ jsx(HeroVideo, {
						src: project.video.src,
						poster: project.video.poster,
						label: project.video.label,
						className: "aspect-video"
					}) : /* @__PURE__ */ jsx(Beeld, {
						src: project.beeld.src,
						alt: project.beeld.alt,
						prioriteit: true,
						className: "max-h-[34rem] w-full object-cover",
						sizes: "(min-width: 1152px) 1104px, 100vw"
					})
				})
			]
		}),
		/* @__PURE__ */ jsxs(Sectie, {
			className: "!pb-10 md:!pb-14",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "grid gap-12 md:grid-cols-[1fr_1.6fr]",
				children: [project.uitdaging && /* @__PURE__ */ jsxs(Reveal, { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-medium md:text-2xl",
					children: "De vraag"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-4 leading-relaxed text-zacht",
					children: project.uitdaging
				})] }), /* @__PURE__ */ jsxs(Reveal, {
					vertraging: 60,
					className: project.uitdaging ? "" : "md:col-span-2 max-w-3xl",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-medium md:text-2xl",
						children: "De oplossing"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-lg leading-relaxed text-zacht",
						children: project.oplossing
					})]
				})]
			}), project.galerij && project.galerij.length > 0 && /* @__PURE__ */ jsx("div", {
				className: "mt-14 grid gap-4 sm:grid-cols-2",
				children: project.galerij.map((b, i) => /* @__PURE__ */ jsx(Reveal, {
					vertraging: i * 60,
					className: "overflow-hidden rounded-kaart border border-lijn",
					children: /* @__PURE__ */ jsx(Beeld, {
						src: b.src,
						alt: b.alt,
						className: "aspect-[3/2] w-full object-cover",
						sizes: "(min-width: 640px) 50vw, 100vw"
					})
				}, b.src))
			})]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Gebruikte oplossingen",
				kop: "De techniek achter dit project",
				className: "!py-16 md:!py-20",
				children: /* @__PURE__ */ jsx("div", {
					className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: producten.map((p) => /* @__PURE__ */ jsx(ProductKaart, {
						product: p,
						sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					}, p.slug))
				})
			})
		}),
		meer.length > 0 && /* @__PURE__ */ jsx(Sectie, {
			kicker: "Meer in deze sector",
			kop: "Vergelijkbare projecten",
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: meer.map((p) => /* @__PURE__ */ jsx(ProjectKaart, {
					project: p,
					sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
				}, p.slug))
			})
		}),
		/* @__PURE__ */ jsx(CtaSectie, {
			kop: "Een vergelijkbaar project voor uw merk of locatie?",
			tekst: "Vertel ons uw situatie; we laten zien wat er kan, inclusief voorbeelden uit de praktijk."
		})
	] });
}
//#endregion
//#region src/pages/Diensten.tsx
var FASEN = [
	{
		nummer: "01",
		kop: "Concept & advies",
		tekst: "Elk project begint met uw doelstellingen, niet met een apparaat. We denken mee over wat u wilt bereiken, bij welke bezoekers, op welke plek, en selecteren samen de technologie die daarin voorziet. In onze showroom in Den Haag demonstreren we vrijwel alle oplossingen, zodat u kiest op basis van wat u zelf heeft ervaren."
	},
	{
		nummer: "02",
		kop: "Content & studio",
		tekst: "Techniek zonder goede content is een leeg scherm. Onze eigen studio ontwerpt de animaties, spellen en presentaties die uw systemen tonen: volledig in uw huisstijl, afgestemd op uw campagne en later eenvoudig te vernieuwen. Doordat Vision2Watch met zelfontwikkelde software werkt, passen we content snel aan, ook vlak voor een deadline."
	},
	{
		nummer: "03",
		kop: "Installatie & integratie",
		tekst: "Ons installatieteam zorgt dat elke oplossing op de juiste manier wordt geïnstalleerd en afgesteld: projectoren onzichtbaar weggewerkt, camera's gekalibreerd op het omgevingslicht, alles getest vóór de opening of beursdag. Ook combinaties van technologieën, van vloer tot etalage tot LED, integreren we tot één werkend geheel."
	},
	{
		nummer: "04",
		kop: "Service & onderhoud",
		tekst: "Na oplevering blijven we beschikbaar. Vision2Watch biedt diverse services, variërend van preventief onderhoud tot een complete Service Level Agreement (SLA). Vaste installaties zoals die bij Ouwehands Dierenpark houden we al jaren draaiend, inclusief periodieke updates van content en projectoren."
	}
];
var HUUR_KOOP = [
	{
		kop: "Huren per event",
		tekst: "Voor beurzen, lanceringen en tijdelijke campagnes: wij leveren, bouwen op, stellen af en breken af. Inclusief content passend bij uw event."
	},
	{
		kop: "Kopen voor vast gebruik",
		tekst: "Bij aankoop zet u het systeem onbeperkt opnieuw in, zonder extra kosten, met telkens nieuwe content. Voor permanente opstellingen adviseren we een onderhoudsafspraak."
	},
	{
		kop: "Maatwerk & combinaties",
		tekst: "Van AR-ontwikkeling op onze eigen Augmented engine tot complete belevingsruimtes: we bouwen ook wat er nog niet is."
	}
];
var FAQ = [
	{
		vraag: "Werken jullie ook voor bureaus en standbouwers?",
		antwoord: "Ja, veel projecten lopen via event- en marketingbureaus, zoals de interactieve vloer voor Euroveiling namens Jada Events en de interactieve bar voor Clinique in opdracht van Bolt Amsterdam. We werken onder uw regie of rechtstreeks met de eindklant."
	},
	{
		vraag: "Wat kost een project?",
		antwoord: "Dat hangt af van techniek, formaat, content en huur of koop. Vraag de prijslijst aan voor het actuele overzicht; voor maatwerk maken we een offerte op basis van uw situatie."
	},
	{
		vraag: "Hoe snel kan een project live?",
		antwoord: "Verhuur met bestaande content kan snel; maatwerkcontent en vaste installaties vragen productietijd. Neem contact op met uw datum en we plannen er concreet naartoe."
	}
];
function Diensten() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
			children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Diensten" }] }), /* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl pb-10 pt-10 md:pt-14",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: "Diensten"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-4xl font-medium leading-[1.1] md:text-5xl",
						children: "Van eerste idee tot draaiende installatie"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: "Vision2Watch is geen doorgeefluik van hardware. We adviseren, ontwerpen content in eigen huis, installeren op locatie en blijven verantwoordelijk voor service en onderhoud. Eén partner, één aanspreekpunt, het hele traject."
					})
				]
			})]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn",
			children: /* @__PURE__ */ jsx("div", {
				className: "mx-auto w-full max-w-6xl px-5 md:px-8",
				children: /* @__PURE__ */ jsx("ol", { children: FASEN.map((f, i) => /* @__PURE__ */ jsxs(Reveal, {
					as: "li",
					className: `grid gap-6 py-12 md:grid-cols-[8rem_1fr] md:gap-12 ${i > 0 ? "border-t border-lijn" : ""}`,
					children: [/* @__PURE__ */ jsx("p", {
						className: "font-display text-4xl font-medium text-accent md:text-5xl",
						children: f.nummer
					}), /* @__PURE__ */ jsxs("div", {
						className: "max-w-3xl",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-medium md:text-3xl",
							children: f.kop
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-4 text-lg leading-relaxed text-zacht",
							children: f.tekst
						})]
					})]
				}, f.nummer)) })
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsxs(Sectie, {
				kicker: "Flexibel",
				kop: "Huren, kopen of maatwerk",
				children: [/* @__PURE__ */ jsx("div", {
					className: "mt-10 grid gap-8 md:grid-cols-3",
					children: HUUR_KOOP.map((h, i) => /* @__PURE__ */ jsxs(Reveal, {
						vertraging: i * 70,
						className: "border-t border-lijn pt-5",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-display text-lg font-medium",
							children: h.kop
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-2 leading-relaxed text-zacht",
							children: h.tekst
						})]
					}, h.kop))
				}), /* @__PURE__ */ jsx(Reveal, {
					className: "mt-10",
					children: /* @__PURE__ */ jsx(Knop, {
						naar: "/prijslijst",
						children: "Prijslijst aanvragen"
					})
				})]
			})
		}),
		/* @__PURE__ */ jsx(Sectie, {
			kicker: "Eigen studio",
			kop: "Content wordt hier gemaakt, niet uitbesteed",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mt-10 grid items-center gap-10 md:grid-cols-2",
				children: [/* @__PURE__ */ jsx(Reveal, {
					className: "overflow-hidden rounded-kaart border border-lijn",
					children: /* @__PURE__ */ jsx(Beeld, {
						src: "/media/studio-content-werkplek.webp",
						alt: "Animator werkt aan interactieve content in de studio van Vision2Watch",
						className: "aspect-[4/3] w-full object-cover",
						sizes: "(min-width: 768px) 50vw, 100vw"
					})
				}), /* @__PURE__ */ jsxs(Reveal, {
					vertraging: 80,
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-lg leading-relaxed text-zacht",
						children: "Animaties, spellen, virtuele presentatoren en panoramische producties ontstaan in onze eigen studio. Dat betekent korte lijnen, snelle aanpassingen en content die exact aansluit op de techniek waarop hij draait. Als een van de weinige partijen in Europa ontwikkelen we ook de interactieve software zelf."
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-8",
						children: /* @__PURE__ */ jsx(Knop, {
							naar: "/projecten",
							variant: "secundair",
							children: "Bekijk het resultaat"
						})
					})]
				})]
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Veelgestelde vragen",
				kop: "Praktische vragen",
				children: /* @__PURE__ */ jsx("div", {
					className: "mt-10 max-w-3xl",
					children: /* @__PURE__ */ jsx(FaqLijst, { items: FAQ })
				})
			})
		}),
		/* @__PURE__ */ jsx(CtaSectie, {})
	] });
}
//#endregion
//#region src/pages/Kennisbank.tsx
function Kennisbank() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
		className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
		children: [
			/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Kennisbank" }] }),
			/* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl pb-10 pt-10 md:pt-14",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: "Kennisbank"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-4xl font-medium leading-[1.1] md:text-5xl",
						children: "Hoe werkt het eigenlijk?"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: "Heldere antwoorden op de vragen die klanten ons echt stellen: over techniek, kosten en keuzes. Geen verkooppraat, wel uitleg."
					})
				]
			}),
			/* @__PURE__ */ jsx("ul", {
				className: "grid gap-4 pb-20 md:grid-cols-2",
				children: ARTIKELEN.map((a, i) => /* @__PURE__ */ jsx(Reveal, {
					as: "li",
					vertraging: i * 50,
					children: /* @__PURE__ */ jsxs(Link, {
						to: `/kennisbank/${a.slug}`,
						className: "group flex h-full flex-col rounded-kaart border border-lijn bg-nacht p-6 transition-colors hover:border-accent/60",
						children: [
							/* @__PURE__ */ jsx("h2", {
								className: "font-display text-xl font-medium leading-snug",
								children: a.kop
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-3 flex-1 leading-relaxed text-zacht",
								children: [a.antwoord.split(". ").slice(0, 2).join(". "), "."]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-5 font-display text-[0.9rem] font-medium text-accent",
								children: ["Lees het antwoord ", /* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									className: "inline-block transition-transform duration-200 group-hover:translate-x-1",
									children: "→"
								})]
							})
						]
					})
				}, a.slug))
			})
		]
	}), /* @__PURE__ */ jsx(CtaSectie, {
		kop: "Vraag niet beantwoord?",
		tekst: "Stel hem direct aan ons team; we antwoorden snel en eerlijk, ook als de conclusie is dat u iets niet nodig heeft."
	})] });
}
//#endregion
//#region src/pages/ArtikelDetail.tsx
var datumTekst = (iso) => (/* @__PURE__ */ new Date(iso + "T12:00:00")).toLocaleDateString("nl-NL", {
	day: "numeric",
	month: "long",
	year: "numeric"
});
function ArtikelDetail() {
	const { slug } = useParams();
	const artikel = slug ? vindArtikel(slug) : void 0;
	if (!artikel) return /* @__PURE__ */ jsx(NietGevonden, {});
	const producten = artikel.verwantProduct.map((s) => PRODUCTEN.find((p) => p.slug === s)).filter(Boolean);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("article", {
			className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
			children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{
				naam: "Kennisbank",
				pad: "/kennisbank"
			}, { naam: artikel.kop }] }), /* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl pb-14 pt-10 md:pt-14",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: "Kennisbank"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-3xl font-medium leading-[1.15] md:text-[2.75rem]",
						children: artikel.kop
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-4 text-[0.85rem] text-dof",
						children: [
							"Gepubliceerd ",
							datumTekst(artikel.gepubliceerd),
							artikel.gewijzigd !== artikel.gepubliceerd && /* @__PURE__ */ jsxs(Fragment, { children: [" · bijgewerkt ", datumTekst(artikel.gewijzigd)] })
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-8 border-l-2 border-accent pl-5 text-lg leading-relaxed md:text-xl md:leading-relaxed",
						children: artikel.antwoord
					}),
					artikel.secties.map((s) => /* @__PURE__ */ jsxs(Reveal, {
						as: "section",
						className: "mt-12",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-medium",
							children: s.kop
						}), s.alineas.map((al) => /* @__PURE__ */ jsx("p", {
							className: "mt-4 leading-relaxed text-zacht",
							children: al
						}, al.slice(0, 40)))]
					}, s.kop)),
					artikel.faq && artikel.faq.length > 0 && /* @__PURE__ */ jsxs("section", {
						className: "mt-14",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-medium",
							children: "Veelgestelde vragen"
						}), /* @__PURE__ */ jsx("div", {
							className: "mt-6",
							children: /* @__PURE__ */ jsx(FaqLijst, { items: artikel.faq })
						})]
					})
				]
			})]
		}),
		producten.length > 0 && /* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Bijpassende oplossingen",
				kop: "Verder kijken",
				className: "!py-16 md:!py-20",
				children: /* @__PURE__ */ jsx("div", {
					className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: producten.map((p) => /* @__PURE__ */ jsx(ProductKaart, {
						product: p,
						sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					}, p.slug))
				})
			})
		}),
		/* @__PURE__ */ jsx(CtaSectie, {})
	] });
}
//#endregion
//#region src/pages/OverOns.tsx
var PIJLERS = [
	{
		kop: "Eigen software",
		tekst: "Als een van de weinige partijen in Europa ontwikkelen we onze interactieve software zelf. Content aanpassen aan een huisstijl of campagne doen we daardoor snel en in eigen huis."
	},
	{
		kop: "Eigen studio",
		tekst: "Animatoren, programmeurs en ontwerpers maken hier de content die onze systemen tonen, van vloerspel tot holografische productie."
	},
	{
		kop: "Eigen installatieteam",
		tekst: "Wij bouwen zelf op, stellen af en onderhouden, van eenmalige beursopstelling tot permanente installaties die al jaren draaien."
	}
];
function OverOns() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
			children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Over ons" }] }), /* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl pb-10 pt-10 md:pt-14",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "kicker mb-3",
						children: "Over ons"
					}),
					/* @__PURE__ */ jsxs("h1", {
						className: "text-4xl font-medium leading-[1.1] md:text-5xl",
						children: [
							"Sinds ",
							SITE.oprichtingsjaar,
							" laten we ruimtes reageren"
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-lg leading-relaxed text-zacht",
						children: "Vision2Watch is gespecialiseerd in denken buiten de gebaande paden. Door kennis van marketing, audio en visuals te combineren zetten we interactieve projectie, holografie en mixed reality om in oplossingen die klanten telkens weer verbazen: inspirerende ideeën, kwalitatief hoogstaand werk en volledige toewijding."
					})
				]
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mx-auto w-full max-w-6xl px-5 pb-4 md:px-8",
			children: /* @__PURE__ */ jsx(Reveal, {
				className: "overflow-hidden rounded-kaart border border-lijn",
				children: /* @__PURE__ */ jsx(Beeld, {
					src: "/media/euroveiling-bloemenvloer.webp",
					alt: "Interactieve bloemenvloer van Vision2Watch tijdens het jubileum van Euroveiling",
					prioriteit: true,
					className: "max-h-[30rem] w-full object-cover",
					sizes: "(min-width: 1152px) 1104px, 100vw"
				})
			})
		}),
		/* @__PURE__ */ jsx(Sectie, {
			kicker: "Waarom Vision2Watch",
			kop: "Alles onder één dak, letterlijk",
			children: /* @__PURE__ */ jsx("div", {
				className: "mt-10 grid gap-8 md:grid-cols-3",
				children: PIJLERS.map((p, i) => /* @__PURE__ */ jsxs(Reveal, {
					vertraging: i * 70,
					className: "border-t border-lijn pt-5",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "font-display text-lg font-medium",
						children: p.kop
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-2 leading-relaxed text-zacht",
						children: p.tekst
					})]
				}, p.kop))
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-t border-lijn bg-nacht/40",
			children: /* @__PURE__ */ jsx(Sectie, {
				kicker: "Team",
				kop: "De mensen achter het werk",
				lead: "Een compact team van specialisten: van concept en planning tot animatie, techniek en installatie.",
				children: /* @__PURE__ */ jsx("ul", {
					className: "mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-5",
					children: TEAM.map((lid, i) => /* @__PURE__ */ jsxs(Reveal, {
						as: "li",
						vertraging: i * 40,
						className: "border-t border-lijn pt-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "font-display text-[1.05rem] font-medium",
							children: lid.naam
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[0.9rem] text-zacht",
							children: lid.rol
						})]
					}, lid.naam))
				})
			})
		}),
		/* @__PURE__ */ jsx(Sectie, {
			kicker: "Netwerk",
			kop: "Partners en zusterbedrijf",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mt-10 grid gap-8 md:grid-cols-2",
				children: [/* @__PURE__ */ jsxs(Reveal, {
					className: "rounded-kaart border border-lijn bg-nacht p-7",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "font-display text-xl font-medium",
							children: "HEREweHOLO"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 leading-relaxed text-zacht",
							children: "Ons zusterbedrijf HEREweHOLO is volledig gespecialiseerd in holografische oplossingen: holoboxen, Holomini's en hologramwanden. Beide teams werken nauw samen; holografische projecten lopen vaak gezamenlijk."
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-5",
							children: /* @__PURE__ */ jsx(Knop, {
								naar: "https://www.hereweholo.nl",
								variant: "secundair",
								children: "Naar hereweholo.nl"
							})
						})
					]
				}), /* @__PURE__ */ jsxs(Reveal, {
					vertraging: 80,
					className: "rounded-kaart border border-lijn bg-nacht p-7",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "font-display text-xl font-medium",
						children: "Epson"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-3 leading-relaxed text-zacht",
						children: "Met Epson ontwikkelden we de mobiele interactieve vloer en de Virtual Product Presenter, en namen we deel aan het Store of the Future-programma. Projectietechniek van topniveau, gecombineerd met onze interactieve software."
					})]
				})]
			})
		}),
		/* @__PURE__ */ jsx(LogoBalk, {}),
		/* @__PURE__ */ jsx(Sectie, {
			kicker: "Showroom",
			kop: "Kom kijken in Den Haag",
			lead: `Vrijwel al onze oplossingen staan opgesteld in de showroom aan de ${SITE.adres.straat} in ${SITE.adres.plaats}, inclusief het 9 meter lange holografische scherm, het langste van Nederland.`,
			children: /* @__PURE__ */ jsxs(Reveal, {
				className: "mt-8 flex flex-wrap gap-3",
				children: [/* @__PURE__ */ jsx(Knop, {
					naar: "/contact",
					children: "Plan een bezoek"
				}), /* @__PURE__ */ jsx(Knop, {
					naar: "/projecten",
					variant: "secundair",
					children: "Bekijk eerst ons werk"
				})]
			})
		}),
		/* @__PURE__ */ jsx(CtaSectie, {})
	] });
}
//#endregion
//#region src/components/site/Formulier.tsx
function Formulier({ naam, knoptekst, toonInteresse = false }) {
	const [fout, setFout] = useState(null);
	return /* @__PURE__ */ jsxs("form", {
		name: naam,
		method: "POST",
		action: "/bedankt",
		"data-netlify": "true",
		"netlify-honeypot": "bedrijfsnaam-2",
		className: "max-w-xl space-y-5",
		onInvalid: () => setFout("Controleer de rood gemarkeerde velden en probeer opnieuw."),
		onSubmit: () => setFout(null),
		children: [
			/* @__PURE__ */ jsx("input", {
				type: "hidden",
				name: "form-name",
				value: naam
			}),
			/* @__PURE__ */ jsx("p", {
				className: "hidden",
				children: /* @__PURE__ */ jsxs("label", { children: ["Laat dit veld leeg: ", /* @__PURE__ */ jsx("input", { name: "bedrijfsnaam-2" })] })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-5 sm:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
					htmlFor: `${naam}-naam`,
					className: "mb-1.5 block text-[0.9rem] text-zacht",
					children: ["Naam ", /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "text-accent",
						children: "*"
					})]
				}), /* @__PURE__ */ jsx("input", {
					id: `${naam}-naam`,
					name: "naam",
					type: "text",
					required: true,
					autoComplete: "name",
					className: "w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst placeholder:text-dof invalid:[&:user-invalid]:border-red-400"
				})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
					htmlFor: `${naam}-bedrijf`,
					className: "mb-1.5 block text-[0.9rem] text-zacht",
					children: "Bedrijf"
				}), /* @__PURE__ */ jsx("input", {
					id: `${naam}-bedrijf`,
					name: "bedrijf",
					type: "text",
					autoComplete: "organization",
					className: "w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst"
				})] })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-5 sm:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
					htmlFor: `${naam}-email`,
					className: "mb-1.5 block text-[0.9rem] text-zacht",
					children: ["E-mailadres ", /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "text-accent",
						children: "*"
					})]
				}), /* @__PURE__ */ jsx("input", {
					id: `${naam}-email`,
					name: "email",
					type: "email",
					required: true,
					autoComplete: "email",
					className: "w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst invalid:[&:user-invalid]:border-red-400"
				})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
					htmlFor: `${naam}-telefoon`,
					className: "mb-1.5 block text-[0.9rem] text-zacht",
					children: "Telefoon"
				}), /* @__PURE__ */ jsx("input", {
					id: `${naam}-telefoon`,
					name: "telefoon",
					type: "tel",
					autoComplete: "tel",
					className: "w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst"
				})] })]
			}),
			toonInteresse && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
				htmlFor: `${naam}-interesse`,
				className: "mb-1.5 block text-[0.9rem] text-zacht",
				children: "Waarin bent u geïnteresseerd?"
			}), /* @__PURE__ */ jsxs("select", {
				id: `${naam}-interesse`,
				name: "interesse",
				className: "w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst",
				defaultValue: "",
				children: [
					/* @__PURE__ */ jsx("option", {
						value: "",
						children: "Maak een keuze (optioneel)"
					}),
					PRODUCTEN.map((p) => /* @__PURE__ */ jsx("option", {
						value: p.naam,
						children: p.kaartLabel ?? p.naam
					}, p.slug)),
					/* @__PURE__ */ jsx("option", {
						value: "Anders / advies",
						children: "Anders / advies"
					})
				]
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
				htmlFor: `${naam}-bericht`,
				className: "mb-1.5 block text-[0.9rem] text-zacht",
				children: [naam === "prijslijst" ? "Toelichting (optioneel)" : "Waarmee kunnen we helpen?", naam === "contact" && /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: "text-accent",
					children: " *"
				})]
			}), /* @__PURE__ */ jsx("textarea", {
				id: `${naam}-bericht`,
				name: "bericht",
				rows: 5,
				required: naam === "contact",
				className: "w-full rounded-klein border border-lijn bg-inkt px-4 py-3 text-tekst invalid:[&:user-invalid]:border-red-400"
			})] }),
			fout && /* @__PURE__ */ jsx("p", {
				role: "alert",
				className: "rounded-klein border border-red-400/40 bg-red-400/10 px-4 py-3 text-[0.9rem] text-red-200",
				children: fout
			}),
			/* @__PURE__ */ jsx("button", {
				type: "submit",
				className: "rounded-klein bg-accent px-7 py-3.5 font-display font-medium text-inkt transition-colors hover:bg-accent-fel",
				children: knoptekst
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-[0.85rem] leading-relaxed text-dof",
				children: "Uw gegevens gebruiken we alleen om uw aanvraag te beantwoorden. Zie de privacyverklaring."
			})
		]
	});
}
//#endregion
//#region src/pages/Contact.tsx
function Contact() {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
		children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Contact" }] }), /* @__PURE__ */ jsxs("div", {
			className: "grid gap-14 pb-20 pt-10 md:grid-cols-[1fr_1.2fr] md:pt-14",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "kicker mb-3",
					children: "Contact"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "text-4xl font-medium leading-[1.1] md:text-5xl",
					children: "Bespreek uw project"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-5 text-lg leading-relaxed text-zacht",
					children: "Bel, mail of kom langs in de showroom: we denken graag mee, van eerste idee tot concreet plan."
				}),
				/* @__PURE__ */ jsxs("dl", {
					className: "mt-10 space-y-6",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
							className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
							children: "Telefoon"
						}), /* @__PURE__ */ jsxs("dd", {
							className: "mt-2 space-y-1",
							children: [
								/* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("a", {
									href: `tel:${SITE.telefoon.algemeen.tel}`,
									className: "text-lg transition-colors hover:text-accent",
									children: SITE.telefoon.algemeen.label
								}), /* @__PURE__ */ jsx("span", {
									className: "ml-2 text-[0.9rem] text-dof",
									children: "algemeen"
								})] }),
								/* @__PURE__ */ jsxs("p", {
									className: "text-[0.95rem] text-zacht",
									children: [
										SITE.telefoon.desmond.naam,
										": ",
										/* @__PURE__ */ jsx("a", {
											href: `tel:${SITE.telefoon.desmond.tel}`,
											className: "transition-colors hover:text-accent",
											children: SITE.telefoon.desmond.label
										})
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-[0.95rem] text-zacht",
									children: [
										SITE.telefoon.ronald.naam,
										": ",
										/* @__PURE__ */ jsx("a", {
											href: `tel:${SITE.telefoon.ronald.tel}`,
											className: "transition-colors hover:text-accent",
											children: SITE.telefoon.ronald.label
										})
									]
								})
							]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
							className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
							children: "E-mail"
						}), /* @__PURE__ */ jsx("dd", {
							className: "mt-2",
							children: /* @__PURE__ */ jsx("a", {
								href: `mailto:${SITE.email}`,
								className: "text-lg transition-colors hover:text-accent",
								children: SITE.email
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
							className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
							children: "Showroom & bezoekadres"
						}), /* @__PURE__ */ jsxs("dd", {
							className: "mt-2 text-zacht",
							children: [/* @__PURE__ */ jsxs("address", {
								className: "not-italic leading-relaxed",
								children: [
									SITE.adres.straat,
									/* @__PURE__ */ jsx("br", {}),
									SITE.adres.postcode,
									" ",
									SITE.adres.plaats
								]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-[0.9rem]",
								children: "Bezoek op afspraak. In de showroom demonstreren we vrijwel alle oplossingen, inclusief het 9 meter lange holografische scherm."
							})]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
							className: "font-display text-[0.85rem] font-medium uppercase tracking-[0.14em] text-dof",
							children: "Gegevens"
						}), /* @__PURE__ */ jsxs("dd", {
							className: "mt-2 text-[0.9rem] text-zacht",
							children: [
								SITE.juridischeNaam,
								" · KvK ",
								SITE.kvk,
								" · BTW ",
								SITE.btw
							]
						})] })
					]
				})
			] }), /* @__PURE__ */ jsx(Reveal, {
				vertraging: 80,
				children: /* @__PURE__ */ jsxs("div", {
					className: "rounded-kaart border border-lijn bg-nacht p-6 md:p-8",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-xl font-medium",
							children: "Stuur een bericht"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mb-6 mt-2 text-[0.95rem] text-zacht",
							children: "We reageren doorgaans binnen één werkdag."
						}),
						/* @__PURE__ */ jsx(Formulier, {
							naam: "contact",
							knoptekst: "Verstuur bericht"
						})
					]
				})
			})]
		})]
	});
}
//#endregion
//#region src/pages/Prijslijst.tsx
var PUNTEN = [
	"Actuele prijzen voor koop én huur",
	"Alle productcategorieën in één overzicht",
	"Inclusief mogelijkheden voor content op maat"
];
function Prijslijst() {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
		children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Prijslijst" }] }), /* @__PURE__ */ jsxs("div", {
			className: "grid gap-14 pb-20 pt-10 md:grid-cols-[1fr_1.2fr] md:pt-14",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "kicker mb-3",
					children: "Prijslijst"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "text-4xl font-medium leading-[1.1] md:text-5xl",
					children: "Vraag de prijslijst aan"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-5 text-lg leading-relaxed text-zacht",
					children: "Laat uw gegevens achter en ontvang de actuele prijslijst van ons assortiment. Liever direct een indicatie voor een specifiek project? Bel of mail ons; dat gaat vaak sneller."
				}),
				/* @__PURE__ */ jsx("ul", {
					className: "mt-8 space-y-3",
					children: PUNTEN.map((p) => /* @__PURE__ */ jsxs("li", {
						className: "flex items-start gap-3 text-zacht",
						children: [/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: "mt-0.5 text-accent",
							children: "✓"
						}), p]
					}, p))
				})
			] }), /* @__PURE__ */ jsx(Reveal, {
				vertraging: 80,
				children: /* @__PURE__ */ jsxs("div", {
					className: "rounded-kaart border border-lijn bg-nacht p-6 md:p-8",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-xl font-medium",
							children: "Uw gegevens"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mb-6 mt-2 text-[0.95rem] text-zacht",
							children: "U ontvangt de prijslijst per e-mail."
						}),
						/* @__PURE__ */ jsx(Formulier, {
							naam: "prijslijst",
							knoptekst: "Prijslijst ontvangen",
							toonInteresse: true
						})
					]
				})
			})]
		})]
	});
}
//#endregion
//#region src/pages/Bedankt.tsx
function Bedankt() {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto flex w-full max-w-6xl flex-col items-start px-5 py-24 md:px-8 md:py-32",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "kicker mb-3",
				children: "Ontvangen"
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "text-4xl font-medium leading-[1.1] md:text-5xl",
				children: "Bedankt voor uw aanvraag"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-5 max-w-xl text-lg leading-relaxed text-zacht",
				children: "Uw bericht is binnen. We reageren doorgaans binnen één werkdag. Kijk in de tussentijd gerust verder bij onze projecten of de kennisbank."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-9 flex flex-wrap gap-3",
				children: [/* @__PURE__ */ jsx(Knop, {
					naar: "/projecten",
					children: "Bekijk projecten"
				}), /* @__PURE__ */ jsx(Knop, {
					naar: "/",
					variant: "secundair",
					children: "Terug naar home"
				})]
			})
		]
	});
}
//#endregion
//#region src/pages/Privacy.tsx
function Privacy() {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
		children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Privacy" }] }), /* @__PURE__ */ jsxs("article", {
			className: "max-w-3xl pb-20 pt-10 md:pt-14",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-4xl font-medium leading-[1.1] md:text-5xl",
					children: "Privacyverklaring"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-4 text-[0.9rem] text-dof",
					children: "Van toepassing op www.vision2watch.nl · versie augustus 2026"
				}),
				/* @__PURE__ */ jsx("section", {
					className: "mt-10 space-y-4 leading-relaxed text-zacht",
					children: /* @__PURE__ */ jsxs("p", { children: [
						"Deze verklaring beschrijft hoe ",
						SITE.juridischeNaam,
						" (KvK ",
						SITE.kvk,
						", ",
						SITE.adres.straat,
						", ",
						SITE.adres.postcode,
						" ",
						SITE.adres.plaats,
						") omgaat met persoonsgegevens op deze website. Vragen hierover kunt u stellen via",
						" ",
						/* @__PURE__ */ jsx("a", {
							href: `mailto:${SITE.email}`,
							className: "text-tekst underline decoration-lijn underline-offset-4 hover:decoration-accent",
							children: SITE.email
						}),
						" of ",
						SITE.telefoon.algemeen.label,
						"."
					] })
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "mt-10",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-2xl font-medium",
						children: "Welke gegevens we verwerken"
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-4 space-y-4 leading-relaxed text-zacht",
						children: [/* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("strong", {
							className: "text-tekst",
							children: "Formulieren."
						}), " Vult u het contact- of prijslijstformulier in, dan verwerken we de gegevens die u zelf opgeeft: naam, e-mailadres en eventueel bedrijfsnaam, telefoonnummer en uw bericht. We gebruiken deze gegevens uitsluitend om uw aanvraag te beantwoorden en bewaren ze niet langer dan daarvoor nodig is."] }), /* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("strong", {
							className: "text-tekst",
							children: "Servergegevens."
						}), " Zoals bij vrijwel elke website registreert de server waarop deze site draait technische gegevens zoals IP-adres, browsertype en opgevraagde pagina's, ten behoeve van beveiliging en het functioneren van de site."] })]
					})]
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "mt-10",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-2xl font-medium",
						children: "Wat we niet doen"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-4 leading-relaxed text-zacht",
						children: /* @__PURE__ */ jsx("p", { children: "Deze website plaatst geen advertentie- of trackingcookies en gebruikt geen statistiekendiensten van derden. Lettertypen worden vanaf onze eigen server geladen; er worden bij het bekijken van pagina's geen gegevens met externe partijen gedeeld. Wordt dat in de toekomst anders, bijvoorbeeld door het toevoegen van een meetinstrument, dan wordt deze verklaring daarop aangepast en wordt waar nodig eerst om toestemming gevraagd." })
					})]
				}),
				/* @__PURE__ */ jsxs("section", {
					className: "mt-10",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-2xl font-medium",
						children: "Uw rechten"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-4 leading-relaxed text-zacht",
						children: /* @__PURE__ */ jsxs("p", { children: [
							"U heeft het recht op inzage, correctie en verwijdering van uw persoonsgegevens, en het recht om bezwaar te maken tegen de verwerking of deze te beperken. Neem daarvoor contact op via ",
							SITE.email,
							". Bent u niet tevreden over de afhandeling, dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens."
						] })
					})]
				})
			]
		})]
	});
}
//#endregion
//#region src/content/nl/voorwaarden.ts
var VOORWAARDEN = [
	"Algemene Voorwaarden van VISION2WATCH B.V. Te Rijswijk, hierna te noemen VISION2WATCH, voor overeenkomsten inzake verkoop, verhuur en facilitaire opdrachten op het vlak van Audiovisuele Technieken, zoals gedeponeerd bij de Kamer van Koophandel te 's-Gravenhage.",
	"DEFINITIES: VISION2WATCH: de besloten vennootschap met beperkte aansprakelijkheid VISION2WATCH, statutair gevestigd te Rijswijk, en alle daaronder vallende vestigingen.",
	"Opdrachtgever: Tenzij uitdrukkelijk anders is overeengekomen, geldt als opdrachtgever die partij welke vermeld wordt als geadresseerde op een prijsopgave, offerte en/of opdrachtbevestiging, diegene die als contractpartij genoemd wordt in een overeenkomst c.q. de partij waarmee VISION2WATCH een overeenkomst sluit.",
	"Overeenkomst: de overeenkomst tussen VISION2WATCH en Opdrachtgever.",
	"I. ALGEMEEN DEEL Toepasselijkheid Tenzij schriftelijk uitdrukkelijk anders is overeengekomen, zijn op alle activiteiten, prijsopgaven, offertes, afspraken en overeenkomsten (waaronder doch niet uitsluitend tot levering van zaken en het verrichten van diensten, onder andere bestaande uit verhuur en verkoop van apparatuur en ter beschikking stelling van personeel), en op alle overige rechtsbetrekkingen tussen partijen de onderhavige voorwaarden van toepassing. De toepasselijkheid van inkoop- of andere voorwaarden van Opdrachtgever wordt hierbij uitdrukkelijk van de hand gewezen.",
	"Aanbiedingen Alle aanbiedingen, prijsopgaven, offertes en andere uitingen van VISION2WATCH zijn vrijblijvend, tenzij hierin door VISION2WATCH uitdrukkelijk schriftelijk anders is aangegeven. VISION2WATCH is gerechtigd, indien na het uitbrengen van een prijsopgave en/of offerte uiteindelijk geen overeenkomst tot stand komt, alle kosten die zij heeft moeten maken in het kader van voornoemde offerte en/of prijsopgave in rekening te brengen aan de Opdrachtgever.",
	"VISION2WATCH kan een offerte tot 10 werkdagen na ontvangst van de acceptatie herroepen. Voor onjuiste en/of onvolledige informatie van derden in bijvoorbeeld folders, productbeschrijvingen, handleidingen etc., die VISION2WATCH doorgeeft, wordt geen aansprakelijkheid uit welke hoofde ook aanvaard.",
	"(Mondelinge) Afspraken of overeenkomsten met ondergeschikten binden VISION2WATCH slechts voor zover deze schriftelijk worden bevestigd door personen die VISION2WATCH rechtsgeldig kunnen vertegenwoordigen. Ten aanzien van de geschiktheid van haar producten voor de door de Opdrachtgever vooropgestelde doeleinden verstrekt VISION2WATCH geen garantie. Evenmin is zij ter zake aansprakelijk, tenzij voornoemde geschiktheid door VISION2WATCH vooraf uitdrukkelijk is bevestigd. Opdrachtgever is verplicht de geschiktheid van de zaken voor zijn specifieke doeleinden zelf te onderzoeken. Iedere aansprakelijkheid voor eventuele schade welke mocht ontstaan bij of ten gevolge van het gebruik van de goederen wordt uitgesloten.",
	"Leverings-/uitvoeringstermijnen en verzuim Leveringen geschieden volledig voor rekening en risico van Opdrachtgever, tenzij schriftelijk anders overeengekomen.",
	"Alle door VISION2WATCH genoemde of overeengekomen (leverings)termijnen zijn naar beste weten en kunnen vastgesteld op grond van de gegevens die bij het aangaan van de Overeenkomst aan VISION2WATCH bekend waren. VISION2WATCH spant zich naar behoren in er zorg voor te dragen dat de door haar te leveren zaken en diensten op het overeengekomen tijdstip worden geleverd.",
	"De enkele overschrijding van een overeengekomen (leverings)termijn brengt VISION2WATCH niet in verzuim. VISION2WATCH accepteert bij overschrijding van de gestelde termijn alleen schriftelijke ingebrekestellingen waarbij aan VISION2WATCH een nadere, alle omstandigheden in aanmerking genomen redelijke termijn voor nakoming wordt gesteld. Indien een vooruitbetaling of een aanbetaling is overeengekomen, begint een termijn voor levering of uitvoering niet eerder te lopen dan nadat de betaling is ontvangen.",
	"VISION2WATCH is te allen tijde gerechtigd de uitvoering van de Overeenkomst geheel of ten dele uit te besteden aan derden, dan wel zich door derden bij de uitvoering van de Overeenkomst te laten bijstaan.",
	"Prijzen en betaling Indien de Opdrachtgever akkoord gaat met de door VISION2WATCH opgestelde offerte is de Opdrachtgever verplicht te voldoen aan de vooraf gestelde aanbetaling. De aanbetaling voor Opdrachtgevers binnen Nederland staat, tenzij schriftelijk anders overeengekomen, vast op 60% van het totale offerte bedrag inclusief de BTW; voor Opdrachtgevers buiten Nederland geldt een aanbetaling van 100% van het totale factuurbedrag. Ook indien betaling achteraf is overeengekomen, heeft VISION2WATCH het recht, indien zij ter zekerstelling van de betaling daartoe gronden aanwezig acht, gehele of gedeeltelijke vooruitbetaling te verlangen en de nakoming van haar verplichtingen op te schorten totdat volledige betaling is verkregen.",
	"Betaling van de koop-, huur- c.q. facilitaire opdrachtprijs geschiedt, tenzij schriftelijk anders overeengekomen, uiterlijk 30 dagen na factuurdatum. Ook indien betaling achteraf is overeengekomen, heeft VISION2WATCH het recht, indien zij ter zekerstelling van de betaling daartoe gronden aanwezig acht, gehele of gedeeltelijke vooruitbetaling te verlangen en de nakoming van haar verplichtingen op te schorten totdat volledige betaling is verkregen.",
	"Bij niet-tijdige betaling is zonder ingebrekestelling vanaf het tijdstip, waarop de geldsom opeisbaar is, over het onbetaalde de wettelijke rente verschuldigd of, indien hoger, een rente van 1 % per maand waarbij een gedeelte van een maand voor een volle maand telt. Tevens zullen de incassokosten op Opdrachtgever worden verhaald.",
	"VISION2WATCH zal na ontvangst van de aanbetaling starten met project gerelateerde werkzaamheden. VISION2WATCH kan niet aansprakelijk gesteld worden voor vertragingen of andere problemen die ontstaan uit het te laat betalen of verzuimen van de aanbetaling. VISION2WATCH behoudt zich het recht voor om oplever data te verplaatsen ten gevolge van het te laat voldoen of volledig verzuimen van de aanbetaling.",
	"Indien betaling in termijnen wordt overeengekomen, ontvangt de Opdrachtgever van VISION2WATCH een betalingsschema. Voor elke verschuldigde betaling ontvangt de Opdrachtgever een aparte factuur waarvan de betaling dient te geschieden binnen 14 dagen na factuurdatum, tenzij schriftelijk anders is overeengekomen. Facturen met betrekking tot gedeeltelijke leveringen moeten worden voldaan binnen de daarvoor geldende betalingstermijn.",
	"Een stijging van de prijsbepalende kosten tussen het sluiten en de voltooiing van de uitvoering van de overeenkomst kan aan Opdrachtgever worden doorberekend. Betaling van de koop-, huur- c.q. facilitaire opdrachtprijs geschiedt op de plaats die en uiterlijk op het tijdstip dat is overeengekomen.",
	"Verrekening met een tegenvordering is slechts toegestaan voor zover de tegenvordering door VISION2WATCH is erkend of in rechte onherroepelijk is vastgesteld.",
	"Ontbinding van de overeenkomst In geval Opdrachtgever niet, niet-tijdig of niet behoorlijk voldoet aan een van haar verplichtingen uit de Overeenkomst, alsmede in geval van faillissement, surséance van betaling, aanvraag daartoe, stillegging of liquidatie van het bedrijf van Opdrachtgever, dan wel bij overname daarvan door derden, wordt Opdrachtgever geacht van rechtswege in verzuim te zijn, zonder dat daartoe een ingebrekestelling zal zijn vereist.",
	"VISION2WATCH is alsdan gerechtigd de tussen haar en Opdrachtgever bestaande Overeenkomsten voor zover deze nog niet zijn uitgevoerd zonder rechterlijke tussenkomst te ontbinden, dan wel de uitvoering daarvan op te schorten alsmede van de Opdrachtgever onmiddellijke betaling te eisen voor de reeds verrichte werkzaamheden c.q. geleverde goederen alsmede vergoeding van schade, kosten en interesten, daaronder begrepen de door VISION2WATCH gederfde winst. Deze bepaling geldt onverminderd het recht van VISION2WATCH om haar eigendomsvoorbehoud te effectueren.",
	"Opdrachtgever machtigt VISION2WATCH onherroepelijk alle ruimten te betreden waarin zich enige aan haar in eigendom toebehorende goederen bevinden teneinde deze weer in haar bezit te stellen.",
	"Reclames Eventuele reclames met betrekking tot door VISION2WATCH geleverde goederen, verrichte werkzaamheden en/of opgestelde factuurbedragen dienen binnen 10 werkdagen na respectievelijk levering van de goederen, beëindiging van de werkzaamheden en/of verzending van de factuur middels een aangetekend schrijven bij VISION2WATCH te worden ingediend onder opgave van relevante feiten en omstandigheden, bij gebreke waarvan de Opdrachtgever ter zake geen rechten zal kunnen doen gelden.",
	"Een tekortschieten in de nakoming van een verplichting is niet toerekenbaar, indien dat tekortschieten het gevolg is van of verband houdt met een al dan niet voorzienbare, buiten de macht van een partij gelegen omstandigheid. Als hoedanig gelden in ieder geval oorlogstoestand, oproer, sabotage, natuurramp, slechte weersomstandigheden, brand, blikseminslag, explosie, uitstroming van gevaarlijke stoffen en/of gassen, staking, bezetting, blokkade, boycot, tekortschieten toeleverancier en/of transporteur, maatregel van de overheid de buitenlandse daaronder begrepen (bijvoorbeeld verbod van import, export, productie, levering).",
	"(Buiten-) gerechtelijke kosten De kosten, die voor VISION2WATCH aan het buiten en/of in rechte optreden wegens het tekortschieten in de nakoming van een of meer verplichtingen jegens VISION2WATCH verbonden zijn, dienen in haar geheel door Opdrachtgever te worden vergoed.",
	"Omvang van aansprakelijkheid voor schade De aansprakelijkheid voor schade uit welke hoofde en van welke aard ook bedraagt per overeenkomst of samenstel van overeenkomsten, in de nakoming waarvan VISION2WATCH toerekenbaar tekortschiet in ieder geval niet meer dan &euro;15.000,- in geval van verkoop, verhuur en facilitaire opdracht. Indien de beperking van aansprakelijkheid in een gegeven geval onredelijk bezwarend of onaanvaardbaar wordt geoordeeld, geldt een beperking die alle omstandigheden van het geval in aanmerking genomen nog aanvaardbaar is.",
	"Schade, die niet binnen 10 dagen na ontdekking aan VISION2WATCH is gemeld of 1 jaar na uitvoering van de betreffende overeenkomst wordt geleden, komt niet meer voor vergoeding in aanmerking.",
	"Gebruik Het is Opdrachtgever niet toegestaan het geleverde voor een ander doel of op een andere plaats te gebruiken dan de overeengekomen bestemming en plaats, aan derden te verhuren dan wel om niet in gebruik af te staan anders dan in de normale bedrijfsuitoefening van Opdrachtgever, te kopiëren, te verpanden dan wel anderszins te bezwaren of te vervreemden.",
	"Opdrachtgever is niet gerechtigd zijn rechten of verplichtingen voortvloeiend uit het contract over te dragen aan derden.",
	"Opdrachtgever dient het geleverde op zorgvuldige wijze en volgens voorschriften van VISION2WATCH te gebruiken.",
	"Intellectuele eigendomsrechten VISION2WATCH behoudt alle intellectuele eigendomsrechten met betrekking tot alle door haar vervaardigde of verstrekte audiovisuele werken, modellen, tekeningen, schetsen, software, producten, ontwerpen, beeldmateriaal, en overige resultaten van de Overeenkomst waarop intellectuele eigendomsrechten (kunnen) rusten. Vooropgesteld dat Opdrachtgever al zijn verplichtingen uit de Overeenkomst volledig is nagekomen, verkrijgt Opdrachtgever slechts het niet-exclusieve recht tot openbaarmaking en verveelvoudiging van het audiovisuele werk indien en conform hetgeen is bepaald in de Overeenkomst.",
	"VISION2WATCH zal Opdrachtgever een niet-exclusief en niet-overdraagbaar gebruiksrecht verlenen met betrekking tot eventuele software die al dan niet is ge&iuml;ncorporeerd in geleverde hardware voor de duur en voor de hardware waarin de software is ge&iuml;ncorporeerd dan wel geleverd. VISION2WATCH dan wel haar licentiegever(s) blijft eigenaar van de intellectuele eigendomsrechten terzake de software. Opdrachtgever verkrijgt enkel een gebruiksrecht.",
	"Tenzij dwingendrechtelijk anders bepaald, is Opdrachtgever niet gerechtigd de software te kopiëren, te onderwerpen aan reverse-engineering, te wijzigen of door te ontwikkelen. Tenzij schriftelijk anders is overeengekomen, is Opdrachtgever slechts gerechtigd tot eigen gebruik van software en is hij onbevoegd deze te vervreemden of onder welke titel dan ook aan derden af te staan of in gebruik te geven.",
	"BIJZONDER DEEL",
	"In aanvulling op of, in geval van strijd, in afwijking van bovenstaande voorwaarden gelden nog de volgende voorwaarden in geval van:",
	"A. VERKOOP",
	"Levering, afname, keuring en herstel van tekortkomingen",
	"VISION2WATCH is tot levering in gedeelten bevoegd. Opdrachtgever is gehouden door hem gekochte zaken af te nemen. De gekochte zaken dienen door Opdrachtgever nauwgezet te worden gekeurd bij of onverwijld na aflevering of, voor zover mede installatie door VISION2WATCH is overeengekomen, na mededeling van VISION2WATCH dat de installatiewerkzaamheden zijn voltooid. Op tekortkomingen, die met een nauwgezette keuring zijn ontdekt of zouden zijn ontdekt maar die niet binnen 10 kalenderdagen na de aflevering c.q. mededeling van de voltooiing van de installatiewerkzaamheden aan VISION2WATCH zijn gemeld, kan geen beroep meer worden gedaan. Tijdig gemelde, aan VISION2WATCH toerekenbare tekortkomingen zullen door VISION2WATCH kosteloos worden opgeheven door naar keuze van VISION2WATCH reparatie of vervanging. Een tekortkoming, waarvan binnen zes maanden na voormelde 10 dagentermijn blijkt en die bij de genoemde keuring niet ontdekt had kunnen worden, wordt kosteloos hersteld. VISION2WATCH kan verlangen, dat zaken voor reparatie aan haar worden opgezonden.",
	"VISION2WATCH verstrekt, tenzij schriftelijk anders is overeengekomen, uitsluitend dezelfde garantie als de fabrikant en slechts indien en voor zover de fabrikant vrijwillig bereid is aan VISION2WATCH te vergoeden hetgeen zij ingevolge de garantiebepalingen van de fabrikant claimt. VISION2WATCH heeft het recht een eventuele schadeclaim op de fabrikant aan haar Opdrachtgever over te dragen. Deze is alsdan gehouden aan zodanige overdracht zijn medewerking te verlenen.",
	"Van een eventueel door VISION2WATCH afgegeven garantie is uitgesloten: gebreken of schade te wijten aan normale slijtage, oneigenlijk gebruik c.q. gebruik waarvoor de goederen niet geschikt zijn ofwel gebruik buiten de normale bedrijfsdoeleinden en omstandigheden van de Opdrachtgever, bedieningsfouten of ingrepen van derden, die zonder uitdrukkelijke toestemming van VISION2WATCH werden uitgevoerd. Voorts vervalt de garantie indien zonder medeweten van VISION2WATCH door derde(n) zaken zijn geleverd of reparaties zijn uitgevoerd in verband met een door VISION2WATCH gedane (hernieuwde) levering, alsmede met door VISION2WATCH verrichte herstel en/of verbeteringswerkzaamheden, ten aanzien waarvan het beroep op garantie wordt gedaan.",
	"In geval van een aan VISION2WATCH toe te rekenen tekortkoming in de nakoming van de Overeenkomst is VISION2WATCH aansprakelijk voor herstel, vervanging van geleverde goederen c.q. prestaties dan wel voor vergoeding van de achtergebleven prestaties tot een maximum van het overeengekomen bedrag voor uitvoering van de Overeenkomst.",
	"Overgang van risico en eigendom",
	"Het risico voor gekochte zaken gaat bij aankomst op de plaats van aflevering of, indien aflevering door aan Opdrachtgever toe te rekenen omstandigheden wordt vertraagd of verhinderd, op het aanvankelijk overeengekomen tijdstip van aflevering blijvend op Opdrachtgever over. De eigendom van alle afgeleverde zaken blijft bij VISION2WATCH totdat Opdrachtgever al zijn betalingsverplichtingen uit of in verband met alle op levering van zaken of verrichting van diensten betrekking hebbende overeenkomsten geheel heeft voldaan. Bij niet tijdige betaling door Opdrachtgever is VISION2WATCH bevoegd de zaken, die haar nog in eigendom toebehoren, eigenmachtig terug te nemen ongeacht waar zij zich bevinden.",
	"B.VERHUUR EN TERBESCHIKKINGSTELLING",
	"Algemeen",
	"Verhuur van apparatuur en goederen (het \"verhuurde\") wordt aangegaan per gespecificeerde huurperiode in hele dagen.",
	"Leveringen en schade",
	"De levering en retournering van het verhuurde geschiedt volledig voor rekening en risico van Opdrachtgever, tenzij schriftelijk anders overeengekomen.",
	"Opdrachtgever zal het verhuurde bij ontvangst inspecteren en zich ervan vergewissen dat het verhuurde aan alle contractuele eisen voldoet. Klachten met betrekking tot het gehuurde die zien op een gebrek, verzuim of manco dat uit redelijke inspectie bij aflevering kan blijken, dienen schriftelijk en binnen 24 uur na aflevering bij VISION2WATCH te zijn ontvangen. Bij de inspectie vastgestelde, tijdig gemelde en aan VISION2WATCH toerekenbare gebreken zal VISION2WATCH kosteloos herstellen. Indien VISION2WATCH niet binnen deze termijn een klacht zoals hierboven beschreven heeft ontvangen, geldt dit als acceptatie van ontvangst in goede orde van het verhuurde. De Opdrachtgever kan ter zake geen recht tot schadevergoeding of vervanging geldend maken.",
	"Indien de Opdrachtgever een overschrijding van de overeengekomen huurtermijn voorziet dient hij VISION2WATCH hiervan onverwijld in kennis te stellen.",
	"De Opdrachtgever is gehouden alle beschadigingen en/of veranderingen aan het verhuurde onverwijld schriftelijk aan VISION2WATCH mede te delen. Het is Opdrachtgever te allen tijde verboden enige veranderingen en/of herstelwerkzaamheden aan het verhuurde uit te voeren.",
	"Opdrachtgever is aansprakelijk voor alle schade aan het verhuurde ontstaan ten tijde van gebruik of na afloop van de huurtermijn, indien deze schade veroorzaakt wordt door veranderingen of herstelwerkzaamheden aangebracht door Opdrachtgever of andere personen die door hem in de mogelijkheid gesteld zijn voornoemde veranderingen en/of herstelwerkzaamheden uit te voeren.",
	"Bij verlies of diefstal van, of onherstelbare schade aan het verhuurde is Opdrachtgever gehouden de som van de aanschafkosten van vervangende apparatuur (op basis van nieuwe gelijkwaardige apparatuur) en de kosten van vervanging aan VISION2WATCH te voldoen. Indien het verhuurde niet-onherstelbaar is beschadigd zal Opdrachtgever de kosten voor herstel van de schade voldoen tegen de in de markt geldende tarieven.",
	"VISION2WATCH is te allen tijde gerechtigd het verhuurde te inspecteren en te onderhouden. Opdrachtgever is verplicht VISION2WATCH daartoe in de gelegenheid te stellen door haar tijdens kantooruren toegang tot het verhuurde te verschaffen, of buiten kantooruren indien nader overeengekomen.",
	"Na het einde van de huurovereenkomst dient Opdrachtgever het gehuurde op de overeengekomen retourdatum en &ndash; tijd in dezelfde staat ter beschikking van VISION2WATCH te stellen door afgifte aan het magazijn van VISION2WATCH dan wel in geval VISION2WATCH het transport verzorgt, dat het verhuurde in dezelfde staat op de door VISION2WATCH aangegeven ophaaldatum en -tijd aan VISION2WATCH wordt aangeboden. Voor iedere dag dat het gehuurde te laat ter beschikking van VISION2WATCH wordt gesteld wordt een boete verbeurd ten bedrage van 100% van de voor die zaken bij VISION2WATCH geldende daghuurprijs, tenzij anders overeengekomen of indien schriftelijk overeenstemming met VISION2WATCH is bereikt.",
	"Vision2Watch is gerechtigd de branduren van de projector na gebruik te controleren en, indien nodig, eventuele discrepanties tussen afgesproken branduren en daadwerkelijke branduren te factureren.",
	"Zorg voor en verzekering van het gehuurde",
	"Opdrachtgever is gehouden alle zorg en voorzichtigheid ten aanzien van het gehuurde te betrachten en alle vanwege VISION2WATCH verstrekte voorschriften en aanwijzingen stipt na te leven. Voor zover het gehuurde tijdens de huur onderhoud behoeft, geschiedt dit door VISION2WATCH maar voor rekening van Opdrachtgever. Het aan derden in gebruik geven van het gehuurde is niet toegestaan. Verlies of beschadiging van of beslag op het gehuurde dienen terstond aan VISION2WATCH te worden gemeld.",
	"Opdrachtgever draagt vanaf aankomst op de plaats van afgifte tot het moment van daadwerkelijke teruggave aan VISION2WATCH het risico van verlies (waaronder vernietiging en diefstal) en beschadiging van het gehuurde voor zover niet het gevolg van een aan VISION2WATCH toerekenbaar gebrek. Opdrachtgever draagt er zorg voor dat het gehuurde in ieder geval vanaf de aankomst op de plaats van afgifte tot het tijdstip van teruggave volledig verzekerd is",
	"tegen verlies en beschadiging ten gevolge van diefstal, brand, blikseminslag, explosie, uitstroming van gevaarlijke stoffen en wateroverlast. Op eerste verzoek geeft Opdrachtgever aan VISION2WATCH inzage in de desbetreffende polis. Vorderingsrechten op de verzekeraar ter zake van het gehuurde worden op eerste verzoek van VISION2WATCH aan haar overgedragen. VISION2WATCH is onherroepelijk gemachtigd om de overdracht mede namens Opdrachtgever te bewerkstelligen.",
	"Duur, (tussentijdse) beëindiging",
	"De huurovereenkomst eindigt, indien voor een bepaalde termijn aangegaan, met het verstrijken van de termijn en, indien voor onbepaalde tijd aangegaan, na schriftelijke opzegging met inachtneming van een termijn van twee kalenderweken. In geval dat VISION2WATCH gerede twijfels heeft over de blijvende nakoming door Opdrachtgever van zijn verplichtingen jegens VISION2WATCH en in het bijzonder wanneer Opdrachtgever besluit tot gehele of gedeeltelijke staking van zijn bedrijfsactiviteiten of surséance van betaling aanvraagt of wanneer verzocht wordt hem in staat van faillissement te verklaren, is VISION2WATCH bevoegd de huurovereenkomst met onmiddellijke ingang op te zeggen. Indien Opdrachtgever tekortschiet in de nakoming van enige verplichting onder de huurovereenkomst is VISION2WATCH bevoegd de huurovereenkomst door middel van een schriftelijke verklaring met onmiddellijke ingang geheel of gedeeltelijk te ontbinden. Bij het tekortschieten in de betaling van de huurprijs dient aan de ontbinding een aanmaning tot betaling vooraf te gaan, tenzij er sprake is van een bij herhaling te laat betalen.",
	"Annulering",
	"Opdrachtgever kan tot uiterlijk 48 uren v&oacute;&oacute;r de overeengekomen aanvangsdatum van de huur de huurovereenkomst geheel of gedeeltelijk annuleren. Bij annulering daarna blijft Opdrachtgever de overeengekomen huursom ten volle verschuldigd en dient hij de huursom van het geannuleerde deel ineens te voldoen."
];
//#endregion
//#region src/pages/Voorwaarden.tsx
function Voorwaarden() {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto w-full max-w-6xl px-5 pt-8 md:px-8",
		children: [/* @__PURE__ */ jsx(Kruimelpad, { items: [{ naam: "Algemene voorwaarden" }] }), /* @__PURE__ */ jsxs("article", {
			className: "max-w-3xl pb-20 pt-10 md:pt-14",
			children: [/* @__PURE__ */ jsx("h1", {
				className: "text-4xl font-medium leading-[1.1] md:text-5xl",
				children: "Algemene voorwaarden"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-10 space-y-4 text-[0.95rem] leading-relaxed text-zacht",
				children: VOORWAARDEN.map((alinea, i) => /* @__PURE__ */ jsx("p", { children: alinea }, i))
			})]
		})]
	});
}
//#endregion
//#region src/routes.tsx
var ROUTES = [
	{
		pad: "/",
		element: /* @__PURE__ */ jsx(Home, {})
	},
	{
		pad: "/producten",
		element: /* @__PURE__ */ jsx(Producten, {})
	},
	{
		pad: "/producten/:slug",
		element: /* @__PURE__ */ jsx(ProductDetail, {})
	},
	{
		pad: "/toepassingen",
		element: /* @__PURE__ */ jsx(Toepassingen, {})
	},
	{
		pad: "/toepassingen/:slug",
		element: /* @__PURE__ */ jsx(SectorDetail, {})
	},
	{
		pad: "/projecten",
		element: /* @__PURE__ */ jsx(Projecten, {})
	},
	{
		pad: "/projecten/:slug",
		element: /* @__PURE__ */ jsx(ProjectDetail, {})
	},
	{
		pad: "/diensten",
		element: /* @__PURE__ */ jsx(Diensten, {})
	},
	{
		pad: "/kennisbank",
		element: /* @__PURE__ */ jsx(Kennisbank, {})
	},
	{
		pad: "/kennisbank/:slug",
		element: /* @__PURE__ */ jsx(ArtikelDetail, {})
	},
	{
		pad: "/over-ons",
		element: /* @__PURE__ */ jsx(OverOns, {})
	},
	{
		pad: "/contact",
		element: /* @__PURE__ */ jsx(Contact, {})
	},
	{
		pad: "/prijslijst",
		element: /* @__PURE__ */ jsx(Prijslijst, {})
	},
	{
		pad: "/bedankt",
		element: /* @__PURE__ */ jsx(Bedankt, {})
	},
	{
		pad: "/privacy",
		element: /* @__PURE__ */ jsx(Privacy, {})
	},
	{
		pad: "/algemene-voorwaarden",
		element: /* @__PURE__ */ jsx(Voorwaarden, {})
	},
	{
		pad: "*",
		element: /* @__PURE__ */ jsx(NietGevonden, {})
	}
];
function alleRoutes() {
	return [
		"/",
		"/producten",
		...PRODUCTEN.map((p) => `/producten/${p.slug}`),
		"/toepassingen",
		...SECTOREN.map((s) => `/toepassingen/${s.slug}`),
		"/projecten",
		...PROJECTEN.map((p) => `/projecten/${p.slug}`),
		"/diensten",
		"/kennisbank",
		...ARTIKELEN.map((a) => `/kennisbank/${a.slug}`),
		"/over-ons",
		"/contact",
		"/prijslijst",
		"/bedankt",
		"/privacy",
		"/algemene-voorwaarden",
		"/404"
	];
}
//#endregion
//#region src/seo/meta.ts
var STATISCHE_META = {
	"/": {
		titel: "Vision2Watch | Interactieve AV-oplossingen en hologrammen",
		description: "Vision2Watch maakt ruimtes interactief: hologrammen, interactieve vloeren, projectie en digitale etalages, van concept en content tot installatie en service."
	},
	"/producten": {
		titel: "Producten: interactieve projectie, holografie en displays | Vision2Watch",
		description: "Alle interactieve AV-oplossingen van Vision2Watch: vloeren, muren, tafels, hologrammen, touchscreens, LED en projectie. Te koop en te huur, met content op maat."
	},
	"/toepassingen": {
		titel: "Toepassingen per sector | Vision2Watch",
		description: "Van beursstand tot museum en van winkel tot showroom: bekijk per sector welke interactieve technologie werkt, met echte projecten als bewijs."
	},
	"/diensten": {
		titel: "Diensten: van concept tot service | Vision2Watch",
		description: "Eén partner voor advies, concept, content, installatie en onderhoud. Vision2Watch levert interactieve AV-oplossingen als totaaloplossing, te koop en te huur."
	},
	"/projecten": {
		titel: "Projecten en cases | Vision2Watch",
		description: "Interactieve vloeren, hologrammen en projecties in de praktijk: bekijk projecten voor onder meer Defensie, Escher Museum, Sea Life, RTL en Clinique."
	},
	"/kennisbank": {
		titel: "Kennisbank: uitleg over interactieve technologie | Vision2Watch",
		description: "Heldere antwoorden op echte vragen: hoe werkt een interactieve vloer, wat is hologram-projectie, kopen of huren? De kennisbank van Vision2Watch legt het uit."
	},
	"/over-ons": {
		titel: "Over Vision2Watch: AV-specialist uit Den Haag",
		description: "Sinds 2008 maakt Vision2Watch ruimtes interactief met eigen software, een eigen studio en een team dat adviseert, bouwt, installeert en onderhoudt."
	},
	"/contact": {
		titel: "Contact en showroom | Vision2Watch",
		description: "Bespreek uw project met Vision2Watch: bel +31 (0)85 007 02 23, mail info@vision2watch.nl of bezoek de showroom in Den Haag met het 9 meter lange holoscherm."
	},
	"/prijslijst": {
		titel: "Prijslijst aanvragen | Vision2Watch",
		description: "Ontvang de actuele prijslijst van Vision2Watch voor interactieve vloeren, hologrammen, touchscreens en meer, voor zowel koop als huur."
	},
	"/bedankt": {
		titel: "Bedankt voor uw aanvraag | Vision2Watch",
		description: "We hebben uw aanvraag ontvangen en nemen snel contact met u op.",
		noindex: true
	},
	"/privacy": {
		titel: "Privacyverklaring | Vision2Watch",
		description: "Hoe Vision2Watch omgaat met persoonsgegevens op deze website: welke gegevens we verwerken, waarom, en welke rechten u heeft."
	},
	"/algemene-voorwaarden": {
		titel: "Algemene voorwaarden | Vision2Watch",
		description: "De algemene leverings- en betalingsvoorwaarden van Vision 2 Watch B.V. voor levering, verhuur en diensten."
	},
	"/404": {
		titel: "Pagina niet gevonden | Vision2Watch",
		description: "Deze pagina bestaat niet (meer). Bekijk producten, projecten of neem contact op.",
		noindex: true
	}
};
//#endregion
//#region src/seo/schema.ts
var abs$1 = (pad) => `${SITE.domein}${pad}`;
var organisatieSchema = () => ({
	"@context": "https://schema.org",
	"@type": "Organization",
	"@id": `${SITE.domein}/#organisatie`,
	name: SITE.naam,
	legalName: SITE.juridischeNaam,
	url: SITE.domein,
	logo: abs$1("/media/logo-v2w.webp"),
	foundingDate: String(SITE.oprichtingsjaar),
	email: SITE.email,
	telephone: SITE.telefoon.algemeen.label,
	identifier: {
		"@type": "PropertyValue",
		propertyID: "KvK",
		value: SITE.kvk
	},
	vatID: SITE.btw,
	address: {
		"@type": "PostalAddress",
		streetAddress: SITE.adres.straat,
		postalCode: SITE.adres.postcode,
		addressLocality: SITE.adres.plaats,
		addressCountry: "NL"
	},
	sameAs: SITE.socials.map((s) => s.url),
	knowsLanguage: ["nl", "en"]
});
var websiteSchema = () => ({
	"@context": "https://schema.org",
	"@type": "WebSite",
	"@id": `${SITE.domein}/#website`,
	url: SITE.domein,
	name: SITE.naam,
	inLanguage: "nl",
	publisher: { "@id": `${SITE.domein}/#organisatie` }
});
var lokaalBedrijfSchema = () => ({
	"@context": "https://schema.org",
	"@type": "LocalBusiness",
	"@id": `${SITE.domein}/#vestiging`,
	name: SITE.naam,
	url: abs$1("/contact"),
	image: abs$1("/media/euroveiling-bloemenvloer.webp"),
	email: SITE.email,
	telephone: SITE.telefoon.algemeen.label,
	identifier: {
		"@type": "PropertyValue",
		propertyID: "KvK",
		value: SITE.kvk
	},
	address: {
		"@type": "PostalAddress",
		streetAddress: SITE.adres.straat,
		postalCode: SITE.adres.postcode,
		addressLocality: SITE.adres.plaats,
		addressCountry: "NL"
	},
	contactPoint: [{
		"@type": "ContactPoint",
		contactType: "sales",
		telephone: SITE.telefoon.algemeen.label,
		email: SITE.email,
		availableLanguage: ["nl", "en"]
	}]
});
var kruimelSchema = (kruimels) => ({
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	itemListElement: kruimels.map((k, i) => ({
		"@type": "ListItem",
		position: i + 1,
		name: k.naam,
		item: abs$1(k.pad)
	}))
});
var productSchema = (p) => ({
	"@context": "https://schema.org",
	"@type": "Product",
	name: p.naam,
	description: p.intro,
	image: abs$1(p.beeld.src),
	url: abs$1(`/producten/${p.slug}`),
	brand: {
		"@type": "Brand",
		name: SITE.naam
	}
});
var faqSchema = (faqs) => ({
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqs.map((f) => ({
		"@type": "Question",
		name: f.vraag,
		acceptedAnswer: {
			"@type": "Answer",
			text: f.antwoord
		}
	}))
});
var artikelSchema = (a) => ({
	"@context": "https://schema.org",
	"@type": "Article",
	headline: a.kop,
	description: a.description,
	datePublished: a.gepubliceerd,
	dateModified: a.gewijzigd,
	inLanguage: "nl",
	mainEntityOfPage: abs$1(`/kennisbank/${a.slug}`),
	author: { "@id": `${SITE.domein}/#organisatie` },
	publisher: { "@id": `${SITE.domein}/#organisatie` }
});
//#endregion
//#region src/seo/head.ts
var STANDAARD_OG = "/media/euroveiling-bloemenvloer.webp";
var abs = (pad) => `${SITE.domein}${pad}`;
function headData(pad) {
	const kruimelBasis = [{
		naam: "Home",
		pad: "/"
	}];
	let m = STATISCHE_META[pad];
	if (m) {
		const schemas = [];
		if (pad === "/") schemas.push(organisatieSchema(), websiteSchema());
		else schemas.push(kruimelSchema([...kruimelBasis, {
			naam: m.titel.split("|")[0].split(":")[0].trim(),
			pad
		}]));
		if (pad === "/contact") schemas.push(lokaalBedrijfSchema());
		return {
			titel: m.titel,
			description: m.description,
			og: STANDAARD_OG,
			noindex: m.noindex,
			schemas
		};
	}
	const productSlug = pad.match(/^\/producten\/([\w-]+)$/)?.[1];
	if (productSlug) {
		const p = PRODUCTEN.find((x) => x.slug === productSlug);
		if (p) return {
			titel: p.titel,
			description: p.description,
			og: p.beeld.src,
			schemas: [
				productSchema(p),
				faqSchema(p.faq),
				kruimelSchema([
					...kruimelBasis,
					{
						naam: "Producten",
						pad: "/producten"
					},
					{
						naam: p.naam,
						pad
					}
				])
			]
		};
	}
	const projectSlug = pad.match(/^\/projecten\/([\w-]+)$/)?.[1];
	if (projectSlug) {
		const p = PROJECTEN.find((x) => x.slug === projectSlug);
		if (p) return {
			titel: `${p.klant}: ${p.titel} | Vision2Watch`,
			description: p.description,
			og: p.beeld.src,
			schemas: [kruimelSchema([
				...kruimelBasis,
				{
					naam: "Projecten",
					pad: "/projecten"
				},
				{
					naam: p.klant,
					pad
				}
			])]
		};
	}
	const sectorSlug = pad.match(/^\/toepassingen\/([\w-]+)$/)?.[1];
	if (sectorSlug) {
		const s = SECTOREN.find((x) => x.slug === sectorSlug);
		if (s) return {
			titel: s.titel,
			description: s.description,
			og: s.beeld.src,
			schemas: [faqSchema(s.faq), kruimelSchema([
				...kruimelBasis,
				{
					naam: "Toepassingen",
					pad: "/toepassingen"
				},
				{
					naam: s.naam,
					pad
				}
			])]
		};
	}
	const artikelSlug = pad.match(/^\/kennisbank\/([\w-]+)$/)?.[1];
	if (artikelSlug) {
		const a = ARTIKELEN.find((x) => x.slug === artikelSlug);
		if (a) return {
			titel: a.titel,
			description: a.description,
			og: STANDAARD_OG,
			schemas: [
				artikelSchema(a),
				...a.faq?.length ? [faqSchema(a.faq)] : [],
				kruimelSchema([
					...kruimelBasis,
					{
						naam: "Kennisbank",
						pad: "/kennisbank"
					},
					{
						naam: a.kop,
						pad
					}
				])
			]
		};
	}
	const nf = STATISCHE_META["/404"];
	return {
		titel: nf.titel,
		description: nf.description,
		og: STANDAARD_OG,
		noindex: true,
		schemas: []
	};
}
var ontsnap = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function bouwHead(pad) {
	const d = headData(pad);
	const canoniek = pad === "/404" ? null : abs(pad === "/" ? "/" : pad);
	return [
		`<title>${ontsnap(d.titel)}</title>`,
		`<meta name="description" content="${ontsnap(d.description)}" />`,
		d.noindex ? `<meta name="robots" content="noindex" />` : "",
		canoniek && !d.noindex ? `<link rel="canonical" href="${canoniek}" />` : "",
		`<meta property="og:type" content="website" />`,
		`<meta property="og:site_name" content="${SITE.naam}" />`,
		`<meta property="og:locale" content="nl_NL" />`,
		`<meta property="og:title" content="${ontsnap(d.titel)}" />`,
		`<meta property="og:description" content="${ontsnap(d.description)}" />`,
		`<meta property="og:url" content="${canoniek || SITE.domein}" />`,
		`<meta property="og:image" content="${abs(d.og)}" />`,
		`<meta name="twitter:card" content="summary_large_image" />`,
		`<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`,
		`<link rel="preload" as="font" type="font/woff2" href="/fonts/space-grotesk.woff2" crossorigin />`,
		`<link rel="preload" as="font" type="font/woff2" href="/fonts/inter.woff2" crossorigin />`,
		`<meta name="theme-color" content="#0b0b0e" />`,
		...d.schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}<\/script>`)
	].filter(Boolean).join("\n    ");
}
var titelVoorPad = (pad) => headData(pad).titel;
//#endregion
//#region src/App.tsx
function App() {
	const locatie = useLocation();
	useEffect(() => {
		document.documentElement.classList.add("js");
	}, []);
	useEffect(() => {
		document.title = titelVoorPad(locatie.pathname);
		if (locatie.hash) document.querySelector(locatie.hash)?.scrollIntoView();
		else window.scrollTo(0, 0);
	}, [locatie.pathname, locatie.hash]);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-svh flex-col",
		children: [
			/* @__PURE__ */ jsx(Header, {}),
			/* @__PURE__ */ jsx("main", {
				id: "inhoud",
				className: "flex-1",
				children: /* @__PURE__ */ jsx(Routes, { children: ROUTES.map((r) => /* @__PURE__ */ jsx(Route, {
					path: r.pad,
					element: r.element
				}, r.pad)) })
			}),
			/* @__PURE__ */ jsx(Footer, {})
		]
	});
}
//#endregion
//#region src/entry-server.tsx
function render(pad) {
	return {
		html: renderToString(/* @__PURE__ */ jsx(StaticRouter, {
			location: pad,
			children: /* @__PURE__ */ jsx(App, {})
		})),
		head: bouwHead(pad)
	};
}
function routes() {
	return alleRoutes();
}
//#endregion
export { render, routes };
