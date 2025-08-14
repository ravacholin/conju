// Comprehensive Spanish verb database
import { additionalVerbs } from './additionalVerbs.js'
import { priorityVerbs } from './priorityVerbs.js'

const baseVerbs = [
  {
    "id": "hablar",
    "lemma": "hablar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "hablo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "hablas",
            "accepts": {
              "vos": "hablás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "hablás",
            "accepts": {
              "tu": "hablas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "habla"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "hablamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "habláis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "hablan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "hablé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "hablaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "hablaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "habló"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "hablamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "hablasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "hablaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "hablaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "hablabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "hablabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "hablaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "hablábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "hablabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "hablaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "hablaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "hablarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "hablarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "hablará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "hablaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "hablaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "hablarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "habla"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "hablá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "hable"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "hablemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "hablad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "hablen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no hables"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no hables"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no hable"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no hablemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no habléis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no hablen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "hable"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "hables"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "hables"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "hable"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "hablemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "habléis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "hablen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "hablara",
            "alt": [
              "hablase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "hablaras",
            "alt": [
              "hablases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "hablaras",
            "alt": [
              "hablases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "hablara",
            "alt": [
              "hablase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "habláramos",
            "alt": [
              "hablásemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "hablarais",
            "alt": [
              "hablaseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "hablaran",
            "alt": [
              "hablasen"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "1s",
            "value": "hablare"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2s_tu",
            "value": "hablares"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2s_vos",
            "value": "hablares"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "3s",
            "value": "hablare"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "1p",
            "value": "habláremos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2p_vosotros",
            "value": "hablareis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "3p",
            "value": "hablaren"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he hablado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has hablado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has hablado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha hablado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos hablado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis hablado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han hablado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había hablado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías hablado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías hablado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había hablado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos hablado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais hablado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían hablado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré hablado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás hablado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás hablado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá hablado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos hablado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis hablado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán hablado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría hablado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías hablado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías hablado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría hablado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos hablado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais hablado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan hablado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera hablado",
            "alt": [
              "hubiese hablado"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras hablado",
            "alt": [
              "hubieses hablado"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras hablado",
            "alt": [
              "hubieses hablado"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera hablado",
            "alt": [
              "hubiese hablado"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos hablado",
            "alt": [
              "hubiésemos hablado"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais hablado",
            "alt": [
              "hubieseis hablado"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran hablado",
            "alt": [
              "hubiesen hablado"
            ]
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a hablar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a hablar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a hablar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a hablar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a hablar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a hablar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a hablar"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "hablo"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "hablas"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "hablás"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "habla"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "hablamos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "habláis"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "hablan"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "hablar"
          },
          {
            "mood": "nonfinite",
            "tense": "infPerf",
            "person": "inv",
            "value": "haber hablado"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "hablado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "hablando"
          }
        ]
      }
    ]
  },
  {
    "id": "comer",
    "lemma": "comer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "como"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "comes",
            "accepts": {
              "vos": "comés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "comés",
            "accepts": {
              "tu": "comes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "come"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "comemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "coméis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "comen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "comí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "comiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "comiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "comió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "comimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "comisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "comieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "comía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "comías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "comías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "comía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "comíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "comíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "comían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "comeré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "comerás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "comerás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "comerá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "comeremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "comeréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "comerán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "come"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "comé"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "coma"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "comamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "comed"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "coman"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no comas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no comas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no coma"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no comamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no comáis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no coman"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "coma"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "comas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "comas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "coma"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "comamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "comáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "coman"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "comiera",
            "alt": [
              "comiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "comieras",
            "alt": [
              "comieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "comieras",
            "alt": [
              "comieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "comiera",
            "alt": [
              "comiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "comiéramos",
            "alt": [
              "comiésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "comierais",
            "alt": [
              "comieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "comieran",
            "alt": [
              "comiesen"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "1s",
            "value": "comiere"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2s_tu",
            "value": "comieres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2s_vos",
            "value": "comieres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "3s",
            "value": "comiere"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "1p",
            "value": "comiéremos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2p_vosotros",
            "value": "comiereis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "3p",
            "value": "comieren"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "comería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "comerías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "comerías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "comería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "comeríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "comeríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "comerían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he comido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has comido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has comido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha comido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos comido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis comido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han comido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había comido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías comido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías comido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había comido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos comido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais comido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían comido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré comido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás comido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás comido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá comido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos comido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis comido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán comido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría comido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías comido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías comido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría comido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos comido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais comido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan comido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera comido",
            "alt": [
              "hubiese comido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras comido",
            "alt": [
              "hubieses comido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras comido",
            "alt": [
              "hubieses comido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera comido",
            "alt": [
              "hubiese comido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos comido",
            "alt": [
              "hubiésemos comido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais comido",
            "alt": [
              "hubieseis comido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran comido",
            "alt": [
              "hubiesen comido"
            ]
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a comer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a comer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a comer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a comer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a comer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a comer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a comer"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "como"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "comes"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "comés"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "come"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "comemos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "coméis"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "comen"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "comer"
          },
          {
            "mood": "nonfinite",
            "tense": "infPerf",
            "person": "inv",
            "value": "haber comido"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "comido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "comiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "vivir",
    "lemma": "vivir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "vivo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "vives",
            "accepts": {
              "vos": "vivís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "vivís",
            "accepts": {
              "tu": "vives"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "vive"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "vivimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "vivís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "viven"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "viví"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "viviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "viviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "vivió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "vivimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "vivisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "vivieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "vivía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "vivías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "vivías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "vivía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "vivíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "vivíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "vivían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "viviré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "vivirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "vivirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "vivirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "viviremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "viviréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "vivirán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "vive"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "viví"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "viva"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "vivamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "vivid"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "vivan"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no vivas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no vivas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no viva"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no vivamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no viváis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no vivan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "viva"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "vivas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "vivas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "viva"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "vivamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "viváis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "vivan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "viviera",
            "alt": [
              "viviese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "vivieras",
            "alt": [
              "vivieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "vivieras",
            "alt": [
              "vivieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "viviera",
            "alt": [
              "viviese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "viviéramos",
            "alt": [
              "viviésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "vivierais",
            "alt": [
              "vivieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "vivieran",
            "alt": [
              "viviesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "viviría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "vivirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "vivirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "viviría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "viviríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "viviríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "vivirían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he vivido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has vivido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has vivido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha vivido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos vivido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis vivido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan vivido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera vivido",
            "alt": [
              "hubiese vivido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras vivido",
            "alt": [
              "hubieses vivido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras vivido",
            "alt": [
              "hubieses vivido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera vivido",
            "alt": [
              "hubiese vivido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos vivido",
            "alt": [
              "hubiésemos vivido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais vivido",
            "alt": [
              "hubieseis vivido"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran vivido",
            "alt": [
              "hubiesen vivido"
            ]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "vivir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "vivido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "viviendo"
          }
        ]
      }
    ]
  },
  {
    "id": "trabajar",
    "lemma": "trabajar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "trabajo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "trabajas",
            "accepts": {
              "vos": "trabajás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "trabajás",
            "accepts": {
              "tu": "trabajas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "trabaja"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "trabajamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "trabajáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "trabajan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "trabajé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "trabajaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "trabajaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "trabajó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "trabajamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "trabajasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "trabajaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "trabajaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "trabajabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "trabajabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "trabajaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "trabajábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "trabajabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "trabajaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "trabajaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "trabajarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "trabajarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "trabajará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "trabajaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "trabajaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "trabajarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "trabaja"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "trabajá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "trabaje"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "trabajemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "trabajad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no trabajes"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no trabajes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "trabaje"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "trabajes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "trabajes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "trabaje"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "trabajemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "trabajéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "trabajara",
            "alt": [
              "trabajase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "trabajaras",
            "alt": [
              "trabajases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "trabajaras",
            "alt": [
              "trabajases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "trabajara",
            "alt": [
              "trabajase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "trabajáramos",
            "alt": [
              "trabajásemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "trabajarais",
            "alt": [
              "trabajaseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "trabajaran",
            "alt": [
              "trabajasen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "trabajaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "trabajarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "trabajarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "trabajaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "trabajaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "trabajaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "trabajarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan trabajado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "trabajar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "trabajado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "trabajando"
          }
        ]
      }
    ]
  },
  {
    "id": "estudiar",
    "lemma": "estudiar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "estudio"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "estudias",
            "accepts": {
              "vos": "estudiás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "estudiás",
            "accepts": {
              "tu": "estudias"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "estudia"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "estudiamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "estudiáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "estudian"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "estudié"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "estudiaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "estudiaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "estudió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "estudiamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "estudiasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "estudiaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "estudiaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "estudiabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "estudiabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "estudiaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "estudiábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "estudiabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "estudiaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "estudiaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "estudiarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "estudiarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "estudiará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "estudiaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "estudiaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "estudiarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "estudia"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "estudiá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "estudie"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "estudiemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "estudiad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no estudies"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no estudies"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "estudie"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "estudies"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "estudies"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "estudie"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "estudiemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "estudiéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "estudiara",
            "alt": [
              "estudiase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "estudiaras",
            "alt": [
              "estudiases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "estudiaras",
            "alt": [
              "estudiases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "estudiara",
            "alt": [
              "estudiase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "estudiáramos",
            "alt": [
              "estudiásemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "estudiarais",
            "alt": [
              "estudiaseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "estudiaran",
            "alt": [
              "estudiasen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "estudiaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "estudiarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "estudiarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "estudiaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "estudiaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "estudiaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "estudiarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan estudiado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "estudiar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "estudiado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "estudiando"
          }
        ]
      }
    ]
  },
  {
    "id": "caminar",
    "lemma": "caminar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "camino"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "caminas",
            "accepts": {
              "vos": "caminás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "caminás",
            "accepts": {
              "tu": "caminas"
            }
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "camina"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "caminá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no camines"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no camines"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "camines"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "camines"
          }
        ]
      }
    ]
  },
  {
    "id": "bailar",
    "lemma": "bailar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "bailo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "bailas",
            "accepts": {
              "vos": "bailás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "bailás",
            "accepts": {
              "tu": "bailas"
            }
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "baila"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "bailá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no bailes"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no bailes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "bailes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "bailes"
          }
        ]
      }
    ]
  },
  {
    "id": "cantar",
    "lemma": "cantar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "canto"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "cantas",
            "accepts": {
              "vos": "cantás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "cantás",
            "accepts": {
              "tu": "cantas"
            }
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "canta"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "cantá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no cantes"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no cantes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "cantes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "cantes"
          }
        ]
      }
    ]
  },
  {
    "id": "escuchar",
    "lemma": "escuchar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "escucho"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "escuchas",
            "accepts": {
              "vos": "escuchás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "escuchás",
            "accepts": {
              "tu": "escuchas"
            }
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "escucha"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "escuchá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no escuches"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no escuches"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "escuches"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "escuches"
          }
        ]
      }
    ]
  },
  {
    "id": "mirar",
    "lemma": "mirar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "miro"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "miras",
            "accepts": {
              "vos": "mirás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "mirás",
            "accepts": {
              "tu": "miras"
            }
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "mira"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "mirá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no mires"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no mires"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "mires"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "mires"
          }
        ]
      }
    ]
  },
  {
    "id": "pensar",
    "lemma": "pensar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "pienso",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "piensas",
            "accepts": {
              "vos": "pensás"
            },
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "pensás",
            "accepts": {
              "tu": "piensas"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "piensa"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "pensá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no pienses"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no pienses"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "pienses"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "pienses"
          }
        ]
      }
    ]
  },
  {
    "id": "empezar",
    "lemma": "empezar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "empiezo",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "empiezas",
            "accepts": {
              "vos": "empezás"
            },
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "empezás",
            "accepts": {
              "tu": "empiezas"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "empieza"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "empezá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no empieces"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no empieces"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "empieces"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "empieces"
          }
        ]
      }
    ]
  },
  {
    "id": "perder",
    "lemma": "perder",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "pierdo",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "pierdes",
            "accepts": {
              "vos": "perdés"
            },
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "perdés",
            "accepts": {
              "tu": "pierdes"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "pierde"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "perdé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no pierdas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no pierdas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "pierdas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "pierdas"
          }
        ]
      }
    ]
  },
  {
    "id": "volver",
    "lemma": "volver",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "vuelvo",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "vuelves",
            "accepts": {
              "vos": "volvés"
            },
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "volvés",
            "accepts": {
              "tu": "vuelves"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "vuelve"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "volvé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no vuelvas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no vuelvas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "vuelvas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "vuelvas"
          }
        ]
      }
    ]
  },
  {
    "id": "dormir",
    "lemma": "dormir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "duermo",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "duermes",
            "accepts": {
              "vos": "dormís"
            },
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "dormís",
            "accepts": {
              "tu": "duermes"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "duerme",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "dormimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "dormís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "duermen",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "dormí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "dormiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "dormiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "durmió",
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "dormimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "dormisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "durmieron",
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "dormía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "dormías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "dormías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "dormía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "dormíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "dormíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "dormían"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "duerme"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "dormí"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no duermas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no duermas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "duerma",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "duermas",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "duermas",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "duerma",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "durmamos",
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "durmáis",
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "duerman",
            "rules": [
              "STEM_O_UE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "durmiera",
            "alt": [
              "durmiese"
            ],
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "durmieras",
            "alt": [
              "durmieses"
            ],
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "durmieras",
            "alt": [
              "durmieses"
            ],
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "durmiera",
            "alt": [
              "durmiese"
            ],
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "durmiéramos",
            "alt": [
              "durmiésemos"
            ],
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "durmierais",
            "alt": [
              "durmieseis"
            ],
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "durmieran",
            "alt": [
              "durmiesen"
            ],
            "rules": [
              "STEM_O_U"
            ]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "dormir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "dormido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "durmiendo",
            "rules": [
              "STEM_O_U"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "jugar",
    "lemma": "jugar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "juego",
            "rules": [
              "STEM_U_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "juegas",
            "accepts": {
              "vos": "jugás"
            },
            "rules": [
              "STEM_U_UE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "jugás",
            "accepts": {
              "tu": "juegas"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "juega"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "jugá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no juegues"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no juegues"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "juegues"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "juegues"
          }
        ]
      }
    ]
  },
  {
    "id": "pedir",
    "lemma": "pedir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "pido",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "pides",
            "accepts": {
              "vos": "pedís"
            },
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "pedís",
            "accepts": {
              "tu": "pides"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "pide",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "pedimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "pedís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "piden",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "pedí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "pediste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "pediste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "pidió",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "pedimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "pedisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "pidieron",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "pedía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "pedías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "pedías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "pedía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "pedíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "pedíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "pedían"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "pide"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "pedí"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no pidas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no pidas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "pida",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "pidas",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "pidas",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "pida",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "pidamos",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "pidáis",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "pidan",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "pidiera",
            "alt": [
              "pidiese"
            ],
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "pidieras",
            "alt": [
              "pidieses"
            ],
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "pidieras",
            "alt": [
              "pidieses"
            ],
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "pidiera",
            "alt": [
              "pidiese"
            ],
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "pidiéramos",
            "alt": [
              "pidiésemos"
            ],
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "pidierais",
            "alt": [
              "pidieseis"
            ],
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "pidieran",
            "alt": [
              "pidiesen"
            ],
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "pedir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "pedido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "pidiendo",
            "rules": [
              "STEM_E_I"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "seguir",
    "lemma": "seguir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "sigo",
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "sigues",
            "accepts": {
              "vos": "seguís"
            },
            "rules": [
              "STEM_E_I"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "seguís",
            "accepts": {
              "tu": "sigues"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "sigue"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "seguí"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no sigas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no sigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "sigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "sigas"
          }
        ]
      }
    ]
  },
  {
    "id": "llegar",
    "lemma": "llegar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "llego"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "llegas",
            "accepts": {
              "vos": "llegás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "llegás",
            "accepts": {
              "tu": "llegas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "llega"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "llegamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "llegáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "llegan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "llegué"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "llegaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "llegaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "llegó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "llegamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "llegasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "llegaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "llegaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "llegabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "llegabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "llegaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "llegábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "llegabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "llegaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "llegaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "llegarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "llegarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "llegará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "llegaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "llegaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "llegarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "llega"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "llegá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "llegue"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "lleguemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "llegad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "lleguen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no llegues"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no llegues"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no llegue"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no lleguemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no lleguéis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no lleguen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "llegue"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "llegues"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "llegues"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "llegue"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "lleguemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "lleguéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "lleguen"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "llegaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "llegarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "llegarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "llegaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "llegaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "llegaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "llegarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he llegado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has llegado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has llegado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha llegado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos llegado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis llegado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han llegado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya llegado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas llegado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas llegado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya llegado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos llegado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis llegado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan llegado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "llegar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "llegado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "llegando"
          }
        ]
      }
    ]
  },
  {
    "id": "necesitar",
    "lemma": "necesitar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "necesito"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "necesitas",
            "accepts": {
              "vos": "necesitás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "necesitás",
            "accepts": {
              "tu": "necesitas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "necesita"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "necesitamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "necesitáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "necesitan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "necesité"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "necesitaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "necesitaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "necesitó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "necesitamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "necesitasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "necesitaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "necesitaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "necesitabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "necesitabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "necesitaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "necesitábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "necesitabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "necesitaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "necesitaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "necesitarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "necesitarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "necesitará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "necesitaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "necesitaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "necesitarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "necesita"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "necesitá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "necesite"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "necesitemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "necesitad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "necesiten"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no necesites"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no necesites"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no necesite"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no necesitemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no necesitéis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no necesiten"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "necesite"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "necesites"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "necesites"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "necesite"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "necesitemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "necesitéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "necesiten"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "necesitaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "necesitarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "necesitarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "necesitaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "necesitaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "necesitaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "necesitarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he necesitado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has necesitado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has necesitado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha necesitado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos necesitado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis necesitado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han necesitado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya necesitado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas necesitado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas necesitado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya necesitado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos necesitado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis necesitado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan necesitado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "necesitar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "necesitado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "necesitando"
          }
        ]
      }
    ]
  },
  {
    "id": "ayudar",
    "lemma": "ayudar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "ayudo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "ayudas",
            "accepts": {
              "vos": "ayudás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "ayudás",
            "accepts": {
              "tu": "ayudas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "ayuda"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "ayudamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "ayudáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "ayudan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "ayudé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "ayudaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "ayudaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "ayudó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "ayudamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "ayudasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "ayudaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "ayudaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "ayudabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "ayudabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "ayudaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "ayudábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "ayudabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "ayudaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "ayudaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "ayudarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "ayudarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "ayudará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "ayudaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "ayudaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "ayudarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "ayuda"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "ayudá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "ayude"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "ayudemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "ayudad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "ayuden"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no ayudes"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no ayudes"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no ayude"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no ayudemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no ayudéis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no ayuden"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "ayude"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "ayudes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "ayudes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "ayude"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "ayudemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "ayudéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "ayuden"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "ayudaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "ayudarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "ayudarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "ayudaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "ayudaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "ayudaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "ayudarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he ayudado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has ayudado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has ayudado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha ayudado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos ayudado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis ayudado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han ayudado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya ayudado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas ayudado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas ayudado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya ayudado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos ayudado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis ayudado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan ayudado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "ayudar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "ayudado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "ayudando"
          }
        ]
      }
    ]
  },
  {
    "id": "buscar",
    "lemma": "buscar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "busco"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "buscas",
            "accepts": {
              "vos": "buscás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "buscás",
            "accepts": {
              "tu": "buscas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "busca"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "buscamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "buscáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "buscan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "busqué"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "buscaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "buscaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "buscó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "buscamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "buscasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "buscaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "buscaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "buscabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "buscabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "buscaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "buscábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "buscabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "buscaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "buscaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "buscarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "buscarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "buscará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "buscaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "buscaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "buscarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "busca"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "buscá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "busque"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "busquemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "buscad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "busquen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no busques"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no busques"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no busque"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no busquemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no busquéis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no busquen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "busque"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "busques"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "busques"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "busque"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "busquemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "busquéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "busquen"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "buscaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "buscarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "buscarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "buscaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "buscaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "buscaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "buscarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he buscado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has buscado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has buscado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha buscado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos buscado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis buscado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han buscado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya buscado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas buscado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas buscado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya buscado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos buscado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis buscado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan buscado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "buscar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "buscado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "buscando"
          }
        ]
      }
    ]
  },
  {
    "id": "comprar",
    "lemma": "comprar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "compro"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "compras",
            "accepts": {
              "vos": "comprás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "comprás",
            "accepts": {
              "tu": "compras"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "compra"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "compramos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "compráis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "compran"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "compré"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "compraste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "compraste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "compró"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "compramos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "comprasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "compraron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "compraba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "comprabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "comprabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "compraba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "comprábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "comprabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "compraban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "compraré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "comprarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "comprarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "comprará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "compraremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "compraréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "comprarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "compra"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "comprá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "compre"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "compremos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "comprad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "compren"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no compres"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no compres"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no compre"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no compremos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no compréis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no compren"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "compre"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "compres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "compres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "compre"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "compremos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "compréis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "compren"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "compraría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "comprarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "comprarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "compraría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "compraríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "compraríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "comprarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan comprado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "comprar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "comprado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "comprando"
          }
        ]
      }
    ]
  },
  {
    "id": "venir",
    "lemma": "venir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "vengo",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "vienes",
            "accepts": {
              "vos": "venís"
            },
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "venís",
            "accepts": {
              "tu": "vienes"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "viene",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "ven"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "vení",
            "accepts": {
              "tu": "ven"
            },
            "rules": [
              "VOSEO_IMP_AFF"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no vengas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no vengas",
            "rules": [
              "VOSEO_NEG_RIOMATCH"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "vengas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "vengas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "viniera",
            "alt": [
              "viniese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "vinieras",
            "alt": [
              "vinieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "vinieras",
            "alt": [
              "vinieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "viniera",
            "alt": [
              "viniese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "viniéramos",
            "alt": [
              "viniésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "vinierais",
            "alt": [
              "vinieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "vinieran",
            "alt": [
              "viniesen"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "venimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "venís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "vienen",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "vine"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "viniste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "viniste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "vino"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "vinimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "vinisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "vinieron"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "vendré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "vendrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "vendrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "vendrá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "vendremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "vendréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "vendrán"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "venga",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "vengas",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "vengas",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "venga",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "vengamos",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "vengáis",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "vengan",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "viniera",
            "alt": [
              "viniese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "vinieras",
            "alt": [
              "vinieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "vinieras",
            "alt": [
              "vinieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "viniera",
            "alt": [
              "viniese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "viniéramos",
            "alt": [
              "viniésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "vinierais",
            "alt": [
              "vinieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "vinieran",
            "alt": [
              "viniesen"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "1s",
            "value": "viniere"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2s_tu",
            "value": "vinieres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2s_vos",
            "value": "vinieres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "3s",
            "value": "viniere"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "1p",
            "value": "viniéremos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "2p_vosotros",
            "value": "viniereis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjFut",
            "person": "3p",
            "value": "vinieren"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "vendría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "vendrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "vendrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "vendría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "vendríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "vendríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "vendrían"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "venir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "venido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "viniendo",
            "rules": [
              "STEM_E_I"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "ser",
    "lemma": "ser",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "soy"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "eres",
            "accepts": {
              "vos": "sos"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "sos",
            "accepts": {
              "tu": "eres"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "es"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "somos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "sois"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "son"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "fui"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "fuiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "fuiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "fue"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "fuimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "fuisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "fueron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "era"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "eras"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "eras"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "era"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "éramos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "erais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "eran"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "sé"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "sé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no seas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no seas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "sea"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "seas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "seas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "sea"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "seamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "seáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "sean"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a ser"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a ser"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a ser"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a ser"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a ser"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a ser"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a ser"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "soy"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "eres"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "sos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "es"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "somos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "sois"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "son"
          }
        ]
      }
    ]
  },
  {
    "id": "estar",
    "lemma": "estar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "estoy"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "estás",
            "accepts": {
              "vos": "estás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "estás",
            "accepts": {
              "tu": "estás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "está"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "estamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "estáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "están"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "estuve"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "estuviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "estuviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "estuvo"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "estuvimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "estuvisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "estuvieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "estaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "estabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "estabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "estaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "estábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "estabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "estaban"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "está"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "está"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no estés"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no estés"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "esté"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "estés"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "estés"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "esté"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "estemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "estéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "estén"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a estar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a estar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a estar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a estar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a estar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a estar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a estar"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "estoy"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "estás"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "estás"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "está"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "estamos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "estáis"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "están"
          }
        ]
      }
    ]
  },
  {
    "id": "tener",
    "lemma": "tener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "tengo",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "tienes",
            "accepts": {
              "vos": "tenés"
            },
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "tenés",
            "accepts": {
              "tu": "tienes"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "tiene",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "tenemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "tenéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "tienen",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "tuve"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "tuviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "tuviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "tuvo"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "tuvimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "tuvisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "tuvieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "tenía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "tenías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "tenías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "tenía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "teníamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "teníais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "tenían"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "ten"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "tené",
            "accepts": {
              "tu": "ten"
            },
            "rules": [
              "VOSEO_IMP_AFF"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no tengas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no tengas",
            "rules": [
              "VOSEO_NEG_RIOMATCH"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "tenga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "tengas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "tengas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "tenga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "tengamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "tengáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "tengan"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a tener"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a tener"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a tener"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a tener"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a tener"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a tener"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a tener"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "tengo"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "tienes"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "tenés"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "tiene"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "tenemos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "tenéis"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "tienen"
          }
        ]
      }
    ]
  },
  {
    "id": "hacer",
    "lemma": "hacer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "hago",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "haces",
            "accepts": {
              "vos": "hacés"
            },
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "hacés",
            "accepts": {
              "tu": "haces"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "hace",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "hacemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "hacéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "hacen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "hice"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "hiciste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "hiciste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "hizo"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "hicimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "hicisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "hicieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "hacía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "hacías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "hacías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "hacía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "hacíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "hacíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "hacían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "haré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "harás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "harás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "hará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "haremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "haréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "harán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "haz"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "hacé",
            "accepts": {
              "tu": "haz"
            },
            "rules": [
              "VOSEO_IMP_AFF"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no hagas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no hagas",
            "rules": [
              "VOSEO_NEG_RIOMATCH"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "haga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "hagas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "hagas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "haga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "hagamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "hagáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "hagan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "hiciera",
            "alt": [
              "hiciese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "hicieras",
            "alt": [
              "hicieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "hicieras",
            "alt": [
              "hicieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "hiciera",
            "alt": [
              "hiciese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "hiciéramos",
            "alt": [
              "hiciésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "hicierais",
            "alt": [
              "hicieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "hicieran",
            "alt": [
              "hiciesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "haría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "harías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "harías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "haría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "haríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "haríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "harían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he hecho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has hecho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has hecho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha hecho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos hecho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis hecho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han hecho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya hecho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas hecho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas hecho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya hecho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos hecho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis hecho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan hecho"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "hacer"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "hecho"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "haciendo"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a hacer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a hacer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a hacer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a hacer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a hacer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a hacer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a hacer"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "hago"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "haces"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "hacés"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "hace"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "hacemos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "hacéis"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "hacen"
          },
          {
            "mood": "nonfinite",
            "tense": "infPerf",
            "person": "inv",
            "value": "haber hecho"
          }
        ]
      }
    ]
  },
  {
    "id": "ir",
    "lemma": "ir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "voy"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "vas",
            "accepts": {
              "vos": "vas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "vas",
            "accepts": {
              "tu": "vas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "va"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "ve"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "andá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no vayas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no vayas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "vayas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "vayas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "iba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "ibas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "ibas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "iba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "íbamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "ibais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "iban"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a ir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a ir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a ir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a ir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a ir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a ir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a ir"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "voy"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "vas"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "vas"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "va"
          }
        ]
      }
    ]
  },
  {
    "id": "decir",
    "lemma": "decir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "digo",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "dices",
            "accepts": {
              "vos": "decís"
            },
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "decís",
            "accepts": {
              "tu": "dices"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "dice",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "di"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "decí",
            "accepts": {
              "tu": "di"
            },
            "rules": [
              "VOSEO_IMP_AFF"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no digas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no digas",
            "rules": [
              "VOSEO_NEG_RIOMATCH"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "decimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "decís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "dicen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "dije"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "dijiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "dijiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "dijo"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "dijimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "dijisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "dijeron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "decía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "decías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "decías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "decía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "decíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "decíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "decían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "diré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "dirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "dirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "dirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "diremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "diréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "dirán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "di"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "decí",
            "accepts": {
              "tu": "di"
            },
            "rules": [
              "VOSEO_IMP_AFF"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no digas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no digas",
            "rules": [
              "VOSEO_NEG_RIOMATCH"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "diga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "digas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "digas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "diga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "digamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "digáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "digan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "dijera",
            "alt": [
              "dijese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "dijeras",
            "alt": [
              "dijeses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "dijeras",
            "alt": [
              "dijeses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "dijera",
            "alt": [
              "dijese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "dijéramos",
            "alt": [
              "dijésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "dijerais",
            "alt": [
              "dijeseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "dijeran",
            "alt": [
              "dijesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "diría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "dirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "dirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "diría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "diríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "diríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "dirían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he dicho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has dicho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has dicho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha dicho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos dicho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis dicho"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han dicho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya dicho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas dicho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas dicho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya dicho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos dicho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis dicho"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan dicho"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "decir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "dicho"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "diciendo"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a decir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a decir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a decir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a decir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a decir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a decir"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a decir"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "digo"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "dices"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "decís"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "dice"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "decimos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "decís"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "dicen"
          },
          {
            "mood": "nonfinite",
            "tense": "infPerf",
            "person": "inv",
            "value": "haber dicho"
          }
        ]
      }
    ]
  },
  {
    "id": "ver",
    "lemma": "ver",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "veo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "ves",
            "accepts": {
              "vos": "ves"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "ves",
            "accepts": {
              "tu": "ves"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "ve"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "vemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "veis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "ven"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "vi"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "viste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "viste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "vio"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "vimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "visteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "vieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "veía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "veías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "veías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "veía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "veíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "veíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "veían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "veré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "verás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "verás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "verá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "veremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "veréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "verán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "ve"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "ve"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no veas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no veas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "vea"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "veas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "veas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "vea"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "veamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "veáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "vean"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "viera",
            "alt": [
              "viese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "vieras",
            "alt": [
              "vieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "vieras",
            "alt": [
              "vieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "viera",
            "alt": [
              "viese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "viéramos",
            "alt": [
              "viésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "vierais",
            "alt": [
              "vieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "vieran",
            "alt": [
              "viesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "vería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "verías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "verías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "vería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "veríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "veríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "verían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he visto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has visto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has visto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha visto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos visto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis visto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han visto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya visto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas visto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas visto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya visto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos visto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis visto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan visto"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "ver"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "visto"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "viendo"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a ver"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a ver"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a ver"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a ver"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a ver"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a ver"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a ver"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "veo"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "ves"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "ves"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "ve"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "vemos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "veis"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "ven"
          },
          {
            "mood": "nonfinite",
            "tense": "infPerf",
            "person": "inv",
            "value": "haber visto"
          }
        ]
      }
    ]
  },
  {
    "id": "dar",
    "lemma": "dar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "doy"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "das",
            "accepts": {
              "vos": "das"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "das",
            "accepts": {
              "tu": "das"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "da"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "da"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "da"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no des"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no des"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "des"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "des"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a dar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a dar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a dar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a dar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a dar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a dar"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a dar"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "doy"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "das"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "das"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "da"
          }
        ]
      }
    ]
  },
  {
    "id": "saber",
    "lemma": "saber",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "sé"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "sabes",
            "accepts": {
              "vos": "sabés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "sabés",
            "accepts": {
              "tu": "sabes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "sabe"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "sabe"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "sabé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no sepas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no sepas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "sepas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "sepas"
          }
        ]
      }
    ]
  },
  {
    "id": "querer",
    "lemma": "querer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "quiero",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "quieres",
            "accepts": {
              "vos": "querés"
            },
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "querés",
            "accepts": {
              "tu": "quieres"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "quiere",
            "rules": [
              "STEM_E_IE"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "quiere"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "queré"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no quieras"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no quieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "quieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "quieras"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a querer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a querer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a querer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a querer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a querer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a querer"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a querer"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "quiero"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "quieres"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "querés"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "quiere"
          }
        ]
      }
    ]
  },
  {
    "id": "poder",
    "lemma": "poder",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "puedo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "puedes",
            "accepts": {
              "vos": "podés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "podés",
            "accepts": {
              "tu": "puedes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "puede"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "podemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "podéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "pueden"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "pude"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "pudiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "pudiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "pudo"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "pudimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "pudisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "pudieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "podía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "podías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "podías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "podía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "podíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "podíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "podían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "podré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "podrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "podrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "podrá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "podremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "podréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "podrán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "puede"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "podé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no puedas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no puedas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "pueda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "puedas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "puedas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "pueda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "podamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "podáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "puedan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "pudiera",
            "alt": [
              "pudiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "pudieras",
            "alt": [
              "pudieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "pudieras",
            "alt": [
              "pudieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "pudiera",
            "alt": [
              "pudiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "pudiéramos",
            "alt": [
              "pudiésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "pudierais",
            "alt": [
              "pudieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "pudieran",
            "alt": [
              "pudiesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "podría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "podrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "podrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "podría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "podríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "podríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "podrían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he podido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has podido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has podido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha podido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos podido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis podido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han podido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya podido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas podido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas podido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya podido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos podido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis podido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan podido"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "poder"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "podido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "pudiendo"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1s",
            "value": "voy a poder"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_tu",
            "value": "vas a poder"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2s_vos",
            "value": "vas a poder"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3s",
            "value": "va a poder"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "1p",
            "value": "vamos a poder"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "2p_vosotros",
            "value": "vais a poder"
          },
          {
            "mood": "indicative",
            "tense": "irAInf",
            "person": "3p",
            "value": "van a poder"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1s",
            "value": "puedo"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_tu",
            "value": "puedes"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2s_vos",
            "value": "podés"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3s",
            "value": "puede"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "1p",
            "value": "podemos"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "2p_vosotros",
            "value": "podéis"
          },
          {
            "mood": "indicative",
            "tense": "presFuturate",
            "person": "3p",
            "value": "pueden"
          },
          {
            "mood": "nonfinite",
            "tense": "infPerf",
            "person": "inv",
            "value": "haber podido"
          }
        ]
      }
    ]
  },
  {
    "id": "salir",
    "lemma": "salir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "salgo",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "sales",
            "accepts": {
              "vos": "salís"
            },
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "salís",
            "accepts": {
              "tu": "sales"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "sale",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "sal"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "salí"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no salgas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no salgas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "salgas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "salgas"
          }
        ]
      }
    ]
  },
  {
    "id": "poner",
    "lemma": "poner",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "pongo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "pones",
            "accepts": {
              "vos": "ponés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "ponés",
            "accepts": {
              "tu": "pones"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "pone"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "ponemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "ponéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "ponen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "puse"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "pusiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "pusiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "puso"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "pusimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "pusisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "pusieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "ponía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "ponías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "ponías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "ponía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "poníamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "poníais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "ponían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "pondré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "pondrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "pondrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "pondrá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "pondremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "pondréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "pondrán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "pon"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "poné"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no pongas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no pongas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "ponga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "pongas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "pongas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "ponga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "pongamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "pongáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "pongan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "pusiera",
            "alt": [
              "pusiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "pusieras",
            "alt": [
              "pusieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "pusieras",
            "alt": [
              "pusieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "pusiera",
            "alt": [
              "pusiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "pusiéramos",
            "alt": [
              "pusiésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "pusierais",
            "alt": [
              "pusieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "pusieran",
            "alt": [
              "pusiesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "pondría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "pondrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "pondrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "pondría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "pondríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "pondríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "pondrían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he puesto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has puesto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has puesto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha puesto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos puesto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis puesto"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han puesto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya puesto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas puesto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas puesto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya puesto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos puesto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis puesto"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan puesto"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "poner"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "puesto"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "poniendo"
          }
        ]
      }
    ]
  },
  {
    "id": "traer",
    "lemma": "traer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "traigo",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "traes",
            "accepts": {
              "vos": "traés"
            },
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "traés",
            "accepts": {
              "tu": "traes"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "trae",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "trae"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "traé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no traigas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no traigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "traigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "traigas"
          }
        ]
      }
    ]
  },
  {
    "id": "caer",
    "lemma": "caer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "caigo",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "caes",
            "accepts": {
              "vos": "caés"
            },
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "caés",
            "accepts": {
              "tu": "caes"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "cae",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "cae"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "caé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no caigas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no caigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "caigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "caigas"
          }
        ]
      }
    ]
  },
  {
    "id": "valer",
    "lemma": "valer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "valgo",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "vales",
            "accepts": {
              "vos": "valés"
            },
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "valés",
            "accepts": {
              "tu": "vales"
            },
            "rules": [
              "VOSEO_PRESENT_STRESS"
            ]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "vale",
            "rules": [
              "STEM_C_Z"
            ]
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "vale"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "valé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no valgas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no valgas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "valgas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "valgas"
          }
        ]
      }
    ]
  },
  {
    "id": "amar",
    "lemma": "amar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "amo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "amas",
            "accepts": {
              "vos": "amás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "amás",
            "accepts": {
              "tu": "amas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "ama"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "amamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "amáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "aman"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "amé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "amaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "amaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "amó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "amamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "amasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "amaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "amaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "amabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "amabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "amaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "amábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "amabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "amaban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "amaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "amarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "amarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "amará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "amaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "amaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "amarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "ama"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "amá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no ames"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no ames"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "ame"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "ames"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "ames"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "ame"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "amemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "améis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "amen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "amara",
            "alt": [
              "amase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "amaras",
            "alt": [
              "amases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "amaras",
            "alt": [
              "amases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "amara",
            "alt": [
              "amase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "amáramos",
            "alt": [
              "amásemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "amarais",
            "alt": [
              "amaseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "amaran",
            "alt": [
              "amasen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "amaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "amarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "amarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "amaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "amaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "amaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "amarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he amado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has amado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has amado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha amado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos amado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis amado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han amado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya amado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas amado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas amado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya amado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos amado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis amado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan amado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "amar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "amado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "amando"
          }
        ]
      }
    ]
  },
  {
    "id": "escribir",
    "lemma": "escribir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "escribo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "escribes",
            "accepts": {
              "vos": "escribís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "escribís",
            "accepts": {
              "tu": "escribes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "escribe"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "escribimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "escribís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "escriben"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "escribí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "escribiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "escribiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "escribió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "escribimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "escribisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "escribieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "escribía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "escribías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "escribías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "escribía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "escribíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "escribíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "escribían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "escribiré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "escribirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "escribirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "escribirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "escribiremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "escribiréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "escribirán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "escribe"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "escribí"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no escribas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no escribas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "escriba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "escribas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "escribas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "escriba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "escribamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "escribáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "escriban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "escribiera",
            "alt": [
              "escribiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "escribieras",
            "alt": [
              "escribieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "escribieras",
            "alt": [
              "escribieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "escribiera",
            "alt": [
              "escribiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "escribiéramos",
            "alt": [
              "escribiésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "escribierais",
            "alt": [
              "escribieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "escribieran",
            "alt": [
              "escribiesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "escribiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "escribirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "escribirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "escribiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "escribiríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "escribiríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "escribirían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan escrito"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "escribir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "escrito"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "escribiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "beber",
    "lemma": "beber",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "bebo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "bebes",
            "accepts": {
              "vos": "bebés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "bebés",
            "accepts": {
              "tu": "bebes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "bebe"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "bebemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "bebéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "beben"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "bebí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "bebiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "bebiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "bebió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "bebimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "bebisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "bebieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "bebía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "bebías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "bebías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "bebía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "bebíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "bebíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "bebían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "beberé"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "beberás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "beberás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "beberá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "beberemos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "beberéis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "beberán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "bebe"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "bebé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no bebas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no bebas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "beba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "bebas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "bebas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "beba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "bebamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "bebáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "beban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "bebiera",
            "alt": [
              "bebiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "bebieras",
            "alt": [
              "bebieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "bebieras",
            "alt": [
              "bebieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "bebiera",
            "alt": [
              "bebiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "bebiéramos",
            "alt": [
              "bebiésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "bebierais",
            "alt": [
              "bebieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "bebieran",
            "alt": [
              "bebiesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "bebería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "beberías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "beberías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "bebería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "beberíamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "beberíais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "beberían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he bebido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has bebido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has bebido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha bebido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos bebido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis bebido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han bebido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya bebido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas bebido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas bebido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya bebido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos bebido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis bebido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan bebido"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "beber"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "bebido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "bebiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "comprar",
    "lemma": "comprar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "compro"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "compras",
            "accepts": {
              "vos": "comprás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "comprás",
            "accepts": {
              "tu": "compras"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "compra"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "compramos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "compráis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "compran"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "compré"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "compraste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "compraste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "compró"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "compramos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "comprasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "compraron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "compraba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "comprabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "comprabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "compraba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "comprábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "comprabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "compraban"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "compraré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "comprarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "comprarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "comprará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "compraremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "compraréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "comprarán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "compra"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "comprá"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no compres"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no compres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "compre"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "compres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "compres"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "compre"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "compremos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "compréis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "compren"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "comprara",
            "alt": [
              "comprase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "compraras",
            "alt": [
              "comprases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "compraras",
            "alt": [
              "comprases"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "comprara",
            "alt": [
              "comprase"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "compráramos",
            "alt": [
              "comprásemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "comprarais",
            "alt": [
              "compraseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "compraran",
            "alt": [
              "comprasen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "compraría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "comprarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "comprarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "compraría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "compraríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "compraríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "comprarían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis comprado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis comprado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan comprado"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "comprar"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "comprado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "comprando"
          }
        ]
      }
    ]
  },
  {
    "id": "vender",
    "lemma": "vender",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "vendo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "vendes",
            "accepts": {
              "vos": "vendés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "vendés",
            "accepts": {
              "tu": "vendes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "vende"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "vendemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "vendéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "venden"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "vendí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "vendiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "vendiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "vendió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "vendimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "vendisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "vendieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "vendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "vendías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "vendías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "vendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "vendíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "vendíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "vendían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "venderé"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "venderás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "venderás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "venderá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "venderemos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "venderéis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "venderán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "vende"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "vendé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no vendas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no vendas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "venda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "vendas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "vendas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "venda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "vendamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "vendáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "vendan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "vendiera",
            "alt": [
              "vendiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "vendieras",
            "alt": [
              "vendieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "vendieras",
            "alt": [
              "vendieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "vendiera",
            "alt": [
              "vendiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "vendiéramos",
            "alt": [
              "vendiésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "vendierais",
            "alt": [
              "vendieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "vendieran",
            "alt": [
              "vendiesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "vendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "venderías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "venderías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "vendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "venderíamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "venderíais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "venderían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he vendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has vendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has vendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha vendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos vendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis vendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han vendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya vendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas vendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas vendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya vendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos vendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis vendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan vendido"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "vender"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "vendido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "vendiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "oir",
    "lemma": "oir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "oigo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "oyes",
            "accepts": {
              "vos": "oís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "oís",
            "accepts": {
              "tu": "oyes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "oye"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "oímos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "oís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "oyen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "oí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "oíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "oíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "oyó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "oímos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "oísteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "oyeron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "oía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "oías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "oías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "oía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "oíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "oíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "oían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "oiré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "oirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "oirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "oirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "oiremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "oiréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "oirán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "oye"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "oí"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no oigas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no oigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "oiga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "oigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "oigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "oiga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "oigamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "oigáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "oigan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "oyera",
            "alt": [
              "oyese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "oyeras",
            "alt": [
              "oyeses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "oyeras",
            "alt": [
              "oyeses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "oyera",
            "alt": [
              "oyese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "oyéramos",
            "alt": [
              "oyésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "oyerais",
            "alt": [
              "oyeseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "oyeran",
            "alt": [
              "oyesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "oiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "oirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "oirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "oiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "oiríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "oiríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "oirían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he oído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has oído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has oído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha oído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos oído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis oído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han oído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya oído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas oído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas oído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya oído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos oído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis oído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan oído"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "oir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "oído"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "oyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "caber",
    "lemma": "caber",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "quepo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "cabes",
            "accepts": {
              "vos": "cabés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "cabés",
            "accepts": {
              "tu": "cabes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "cabe"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "cabemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "cabéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "caben"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "cupe"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "cupiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "cupiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "cupo"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "cupimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "cupisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "cupieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "cabía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "cabías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "cabías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "cabía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "cabíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "cabíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "cabían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "cabré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "cabrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "cabrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "cabrá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "cabremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "cabréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "cabrán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "cabe"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "cabé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no quepas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no quepas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "quepa"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "quepas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "quepas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "quepa"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "quepamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "quepáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "quepan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "cupiera",
            "alt": [
              "cupiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "cupieras",
            "alt": [
              "cupieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "cupieras",
            "alt": [
              "cupieses"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "cupiera",
            "alt": [
              "cupiese"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "cupiéramos",
            "alt": [
              "cupiésemos"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "cupierais",
            "alt": [
              "cupieseis"
            ]
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "cupieran",
            "alt": [
              "cupiesen"
            ]
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "cabría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "cabrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "cabrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "cabría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "cabríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "cabríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "cabrían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he cabido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has cabido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has cabido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha cabido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos cabido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis cabido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han cabido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya cabido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas cabido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas cabido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya cabido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos cabido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis cabido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan cabido"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "caber"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "cabido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "cabiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "valer",
    "lemma": "valer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "valgo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "vales",
            "accepts": {
              "vos": "valés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "valés",
            "accepts": {
              "tu": "vales"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "vale"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "valemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "valéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "valen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "valí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "valiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "valiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "valió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "valimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "valisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "valieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "valía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "valías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "valías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "valía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "valíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "valíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "valían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "valdré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "valdrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "valdrás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "valdrá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "valdremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "valdréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "valdrán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "vale"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "valé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no valgas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no valgas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "valga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "valgas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "valgas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "valga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "valgamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "valgáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "valgan"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "valdría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "valdrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "valdrías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "valdría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "valdríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "valdríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "valdrían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he valido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has valido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has valido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha valido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos valido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis valido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han valido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya valido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas valido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas valido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya valido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos valido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis valido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan valido"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "valer"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "valido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "valiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "caer",
    "lemma": "caer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "caigo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "caes",
            "accepts": {
              "vos": "caés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "caés",
            "accepts": {
              "tu": "caes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "cae"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "caemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "caéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "caen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "caí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "caíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "caíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "cayó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "caímos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "caísteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "cayeron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "caía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "caías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "caías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "caía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "caíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "caíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "caían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "caeré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "caerás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "caerás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "caerá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "caeremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "caeréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "caerán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "cae"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "caé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no caigas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no caigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "caiga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "caigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "caigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "caiga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "caigamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "caigáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "caigan"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "caería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "caerías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "caerías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "caería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "caeríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "caeríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "caerían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he caído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has caído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has caído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha caído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos caído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis caído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han caído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya caído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas caído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas caído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya caído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos caído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis caído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan caído"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "caer"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "caído"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "cayendo"
          }
        ]
      }
    ]
  },
  {
    "id": "traer",
    "lemma": "traer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "traigo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "traes",
            "accepts": {
              "vos": "traés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "traés",
            "accepts": {
              "tu": "traes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "trae"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "traemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "traéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "traen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "traje"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "trajiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "trajiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "trajo"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "trajimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "trajisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "trajeron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "traía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "traías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "traías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "traía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "traíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "traíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "traían"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "traeré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "traerás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "traerás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "traerá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "traeremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "traeréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "traerán"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "trae"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "traé"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no traigas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no traigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "traiga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "traigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "traigas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "traiga"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "traigamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "traigáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "traigan"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "traería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "traerías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "traerías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "traería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "traeríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "traeríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "traerían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he traído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has traído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has traído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha traído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos traído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis traído"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han traído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya traído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas traído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas traído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya traído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos traído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis traído"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan traído"
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "traer"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "traído"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "trayendo"
          }
        ]
      }
    ]
  },
  {
    "id": "aprender",
    "lemma": "aprender",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "aprendido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "aprendiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "comprender",
    "lemma": "comprender",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "comprendido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "comprendiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "responder",
    "lemma": "responder",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "respondido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "respondiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "vender",
    "lemma": "vender",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "vendido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "vendiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "correr",
    "lemma": "correr",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "corrido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "corriendo"
          }
        ]
      }
    ]
  },
  {
    "id": "leer",
    "lemma": "leer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "leído"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "leyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "creer",
    "lemma": "creer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "creo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "crees",
            "accepts": {
              "vos": "creés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "creés",
            "accepts": {
              "tu": "crees"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "cree"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "creemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "creéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "creen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "creí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "creíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "creíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "creyó",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "creímos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "creísteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "creyeron",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "creer"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "creído"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "creyendo",
            "rules": ["HIATUS_Y"]
          }
        ]
      }
    ]
  },
  {
    "id": "deber",
    "lemma": "deber",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "debido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "debiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "recibir",
    "lemma": "recibir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "recibido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "recibiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "abrir",
    "lemma": "abrir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "abierto"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "abriendo"
          }
        ]
      }
    ]
  },
  {
    "id": "cubrir",
    "lemma": "cubrir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "cubierto"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "cubriendo"
          }
        ]
      }
    ]
  },
  {
    "id": "descubrir",
    "lemma": "descubrir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "descubierto"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "descubriendo"
          }
        ]
      }
    ]
  },
  {
    "id": "escribir",
    "lemma": "escribir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "escrito"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "escribiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "subir",
    "lemma": "subir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "subido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "subiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "vivir",
    "lemma": "vivir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "vivido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "viviendo"
          }
        ]
      }
    ]
  },
  {
    "id": "decidir",
    "lemma": "decidir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "decidido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "decidiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "ocurrir",
    "lemma": "ocurrir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "ocurrido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "ocurriendo"
          }
        ]
      }
    ]
  },
  {
    "id": "permitir",
    "lemma": "permitir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "permitido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "permitiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "recibir",
    "lemma": "recibir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "recibido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "recibiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "sufrir",
    "lemma": "sufrir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "sufrido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "sufriendo"
          }
        ]
      }
    ]
  },
  {
    "id": "unir",
    "lemma": "unir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "unido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "uniendo"
          }
        ]
      }
    ]
  },
  {
    "id": "conocer",
    "lemma": "conocer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "conocido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "conociendo"
          }
        ]
      }
    ]
  },
  {
    "id": "nacer",
    "lemma": "nacer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "nacido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "naciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "crecer",
    "lemma": "crecer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "crecido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "creciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "parecer",
    "lemma": "parecer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "parecido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "pareciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "obedecer",
    "lemma": "obedecer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "obedecido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "obedeciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "merecer",
    "lemma": "merecer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "merecido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "mereciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "agradecer",
    "lemma": "agradecer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "agradecido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "agradeciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "establecer",
    "lemma": "establecer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "establecido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "estableciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "ofrecer",
    "lemma": "ofrecer",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "ofrecido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "ofreciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "producir",
    "lemma": "producir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "producido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "produciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "conducir",
    "lemma": "conducir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "conducido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "conduciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "traducir",
    "lemma": "traducir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "traducido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "traduciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "introducir",
    "lemma": "introducir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "introducido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "introduciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "reducir",
    "lemma": "reducir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "reducido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "reduciendo"
          }
        ]
      }
    ]
  },
  {
    "id": "construir",
    "lemma": "construir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "construyo",
            "rules": ["UIR_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "construyes",
            "rules": ["UIR_Y"],
            "accepts": {
              "vos": "construís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "construís",
            "accepts": {
              "tu": "construyes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "construye",
            "rules": ["UIR_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "construimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "construís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "construyen",
            "rules": ["UIR_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "construí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "construiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "construiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "construyó",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "construimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "construisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "construyeron",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "construir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "construido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "construyendo",
            "rules": ["UIR_Y"]
          }
        ]
      }
    ]
  },
  {
    "id": "destruir",
    "lemma": "destruir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "destruyo",
            "rules": ["UIR_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "destruyes",
            "rules": ["UIR_Y"],
            "accepts": {
              "vos": "destruís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "destruís",
            "accepts": {
              "tu": "destruyes"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "destruye",
            "rules": ["UIR_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "destruimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "destruís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "destruyen",
            "rules": ["UIR_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "destruí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "destruiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "destruiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "destruyó",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "destruimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "destruisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "destruyeron",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "destruir"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "destruido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "destruyendo",
            "rules": ["UIR_Y"]
          }
        ]
      }
    ]
  },
  {
    "id": "incluir",
    "lemma": "incluir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "incluido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "incluyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "concluir",
    "lemma": "concluir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "concluido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "concluyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "excluir",
    "lemma": "excluir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "excluido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "excluyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "huir",
    "lemma": "huir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "huido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "huyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "contribuir",
    "lemma": "contribuir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "contribuido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "contribuyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "distribuir",
    "lemma": "distribuir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "distribuido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "distribuyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "atribuir",
    "lemma": "atribuir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "atribuido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "atribuyendo"
          }
        ]
      }
    ]
  },
  {
    "id": "trabajar",
    "lemma": "trabajar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "trabajo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "trabajas"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "trabaja"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "trabajamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "trabajáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "trabajan"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "trabajo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "trabajás"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "trabaja"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "trabajamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "trabajan"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "trabajan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "trabajé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "trabajaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "trabajó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "trabajamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "trabajasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "trabajaron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "trabajé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "trabajaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "trabajó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "trabajamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "trabajaron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "trabajaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "trabajaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "trabajabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "trabajaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "trabajábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "trabajabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "trabajaban"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "trabajaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "trabajabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "trabajaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "trabajábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "trabajaban"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "trabajaban"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han trabajado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían trabajado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían trabajado"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "trabajaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "trabajarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "trabajará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "trabajaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "trabajaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "trabajarán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "trabajaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "trabajarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "trabajará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "trabajaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "trabajarán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "trabajarán"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán trabajado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "trabaje"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "trabajes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "trabaje"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "trabajemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "trabajéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "trabaje"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "trabajes"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "trabaje"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "trabajemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "trabajara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "trabajaras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "trabajara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "trabajáramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "trabajarais"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "trabajaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "trabajara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "trabajaras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "trabajara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "trabajáramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "trabajaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "trabajaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran trabajado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran trabajado"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "trabaja"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "trabaje"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "trabajemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "trabajad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "trabajá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "trabaje"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "trabajemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "trabajen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no trabajes"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no trabaje"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no trabajemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no trabajéis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no trabajen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no trabajes"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no trabaje"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no trabajemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no trabajen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no trabajen"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "trabajaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "trabajarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "trabajaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "trabajaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "trabajaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "trabajarían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "trabajaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "trabajarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "trabajaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "trabajaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "trabajarían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "trabajarían"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían trabajado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían trabajado"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "part",
            "value": "trabajado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "ger",
            "value": "trabajando"
          }
        ]
      }
    ]
  },
  {
    "id": "estudiar",
    "lemma": "estudiar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "estudio"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "estudias"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "estudia"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "estudiamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "estudiáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "estudian"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "estudio"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "estudiás"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "estudia"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "estudiamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "estudian"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "estudian"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "estudié"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "estudiaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "estudió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "estudiamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "estudiasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "estudiaron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "estudié"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "estudiaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "estudió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "estudiamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "estudiaron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "estudiaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "estudiaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "estudiabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "estudiaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "estudiábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "estudiabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "estudiaban"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "estudiaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "estudiabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "estudiaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "estudiábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "estudiaban"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "estudiaban"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han estudiado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían estudiado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían estudiado"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "estudiaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "estudiarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "estudiará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "estudiaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "estudiaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "estudiarán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "estudiaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "estudiarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "estudiará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "estudiaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "estudiarán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "estudiarán"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán estudiado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "estudie"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "estudies"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "estudie"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "estudiemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "estudiéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "estudie"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "estudies"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "estudie"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "estudiemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "estudiara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "estudiaras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "estudiara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "estudiáramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "estudiarais"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "estudiaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "estudiara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "estudiaras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "estudiara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "estudiáramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "estudiaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "estudiaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran estudiado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran estudiado"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "estudia"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "estudie"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "estudiemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "estudiad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "estudiá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "estudie"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "estudiemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "estudien"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no estudies"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no estudie"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no estudiemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no estudiéis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no estudien"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no estudies"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no estudie"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no estudiemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no estudien"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no estudien"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "estudiaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "estudiarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "estudiaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "estudiaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "estudiaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "estudiarían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "estudiaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "estudiarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "estudiaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "estudiaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "estudiarían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "estudiarían"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían estudiado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían estudiado"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "part",
            "value": "estudiado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "ger",
            "value": "estudiando"
          }
        ]
      }
    ]
  },
  {
    "id": "caminar",
    "lemma": "caminar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "camino"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "caminas"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "camina"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "caminamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "camináis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "caminan"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "camino"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "caminás"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "camina"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "caminamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "caminan"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "caminan"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "caminé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "caminaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "caminó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "caminamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "caminasteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "caminaron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "caminé"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "caminaste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "caminó"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "caminamos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "caminaron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "caminaron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "caminaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "caminabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "caminaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "caminábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "caminabais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "caminaban"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "caminaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "caminabas"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "caminaba"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "caminábamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "caminaban"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "caminaban"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han caminado"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían caminado"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían caminado"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "caminaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "caminarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "caminará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "caminaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "caminaréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "caminarán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "caminaré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "caminarás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "caminará"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "caminaremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "caminarán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "caminarán"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán caminado"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "camine"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "camines"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "camine"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "caminemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "caminéis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "caminen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "camine"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "camines"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "camine"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "caminemos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "caminen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "caminen"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "caminara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "caminaras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "caminara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "camináramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "caminarais"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "caminaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "caminara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "caminaras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "caminara"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "camináramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "caminaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "caminaran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran caminado"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran caminado"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "camina"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "camine"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "caminemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "caminad"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "caminen"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "caminá"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "camine"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "caminemos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "caminen"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "caminen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no camines"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no camine"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no caminemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no caminéis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no caminen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no camines"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no camine"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no caminemos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no caminen"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no caminen"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "caminaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "caminarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "caminaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "caminaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "caminaríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "caminarían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "caminaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "caminarías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "caminaría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "caminaríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "caminarían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "caminarían"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían caminado"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían caminado"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "part",
            "value": "caminado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "ger",
            "value": "caminando"
          }
        ]
      }
    ]
  },
  {
    "id": "aprender",
    "lemma": "aprender",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "aprendo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "aprendes"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "aprende"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "aprendemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "aprendéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "aprenden"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "aprendo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "aprendés"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "aprende"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "aprendemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "aprenden"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "aprenden"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "aprendí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "aprendiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "aprendió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "aprendimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "aprendisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "aprendieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "aprendí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "aprendiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "aprendió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "aprendimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "aprendieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "aprendieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "aprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "aprendías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "aprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "aprendíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "aprendíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "aprendían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "aprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "aprendías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "aprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "aprendíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "aprendían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "aprendían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han aprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían aprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían aprendido"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "aprenderé"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "aprenderás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "aprenderá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "aprenderemos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "aprenderéis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "aprenderán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "aprenderé"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "aprenderás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "aprenderá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "aprenderemos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "aprenderán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "aprenderán"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán aprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "aprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "aprendas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "aprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "aprendamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "aprendáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "aprendan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "aprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "aprendas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "aprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "aprendamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "aprendan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "aprendan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "aprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "aprendieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "aprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "aprendiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "aprendierais"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "aprendieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "aprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "aprendieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "aprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "aprendiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "aprendieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "aprendieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran aprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran aprendido"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "aprende"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "aprenda"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "aprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "aprended"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "aprendan"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "aprendé"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "aprenda"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "aprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "aprendan"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "aprendan"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no aprendas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no aprenda"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no aprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no aprendáis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no aprendan"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no aprendas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no aprenda"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no aprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no aprendan"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no aprendan"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "aprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "aprenderías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "aprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "aprenderíamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "aprenderíais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "aprenderían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "aprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "aprenderías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "aprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "aprenderíamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "aprenderían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "aprenderían"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían aprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían aprendido"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "part",
            "value": "aprendido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "ger",
            "value": "aprendiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "comprender",
    "lemma": "comprender",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "comprendo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "comprendes"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "comprende"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "comprendemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "comprendéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "comprenden"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "comprendo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "comprendés"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "comprende"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "comprendemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "comprenden"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "comprenden"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "comprendí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "comprendiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "comprendió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "comprendimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "comprendisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "comprendieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "comprendí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "comprendiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "comprendió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "comprendimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "comprendieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "comprendieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "comprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "comprendías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "comprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "comprendíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "comprendíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "comprendían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "comprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "comprendías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "comprendía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "comprendíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "comprendían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "comprendían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han comprendido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían comprendido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían comprendido"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "comprenderé"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "comprenderás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "comprenderá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "comprenderemos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "comprenderéis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "comprenderán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "comprenderé"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "comprenderás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "comprenderá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "comprenderemos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "comprenderán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "comprenderán"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán comprendido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "comprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "comprendas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "comprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "comprendamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "comprendáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "comprendan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "comprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "comprendas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "comprenda"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "comprendamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "comprendan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "comprendan"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "comprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "comprendieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "comprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "comprendiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "comprendierais"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "comprendieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "comprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "comprendieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "comprendiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "comprendiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "comprendieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "comprendieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran comprendido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran comprendido"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "comprende"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "comprenda"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "comprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "comprended"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "comprendan"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "comprendé"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "comprenda"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "comprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "comprendan"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "comprendan"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no comprendas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no comprenda"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no comprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no comprendáis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no comprendan"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no comprendas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no comprenda"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no comprendamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no comprendan"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no comprendan"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "comprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "comprenderías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "comprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "comprenderíamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "comprenderíais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "comprenderían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "comprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "comprenderías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "comprendería"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "comprenderíamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "comprenderían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "comprenderían"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían comprendido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían comprendido"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "part",
            "value": "comprendido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "ger",
            "value": "comprendiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "escribir",
    "lemma": "escribir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "escribo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "escribes"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "escribe"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "escribimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "escribís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "escriben"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "escribo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "escribís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "escribe"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "escribimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "escriben"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "escriben"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "escribí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "escribiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "escribió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "escribimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "escribisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "escribieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "escribí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "escribiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "escribió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "escribimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "escribieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "escribieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "escribía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "escribías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "escribía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "escribíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "escribíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "escribían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "escribía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "escribías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "escribía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "escribíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "escribían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "escribían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han escrito"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían escrito"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían escrito"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "escribiré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "escribirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "escribirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "escribiremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "escribiréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "escribirán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "escribiré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "escribirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "escribirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "escribiremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "escribirán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "escribirán"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán escrito"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "escriba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "escribas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "escriba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "escribamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "escribáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "escriban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "escriba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "escribas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "escriba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "escribamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "escriban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "escriban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "escribiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "escribieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "escribiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "escribiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "escribierais"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "escribieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "escribiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "escribieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "escribiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "escribiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "escribieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "escribieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran escrito"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran escrito"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "escribe"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "escriba"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "escribamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "escribid"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "escriban"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "escribí"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "escriba"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "escribamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "escriban"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "escriban"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no escribas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no escriba"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no escribamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no escribáis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no escriban"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no escribas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no escriba"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no escribamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no escriban"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no escriban"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "escribiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "escribirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "escribiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "escribiríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "escribiríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "escribirían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "escribiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "escribirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "escribiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "escribiríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "escribirían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "escribirían"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían escrito"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían escrito"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "part",
            "value": "escrito"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "ger",
            "value": "escribiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "recibir",
    "lemma": "recibir",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "recibo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "recibes"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "recibe"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "recibimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "recibís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "reciben"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "recibo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "recibís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "recibe"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "recibimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "reciben"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "reciben"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "recibí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "recibiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "recibió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "recibimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "recibisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "recibieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "recibí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "recibiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "recibió"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "recibimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "recibieron"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "recibieron"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "recibía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_tu",
            "value": "recibías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "recibía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "recibíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2p_vosotros",
            "value": "recibíais"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "recibían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1s",
            "value": "recibía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "2s_vos",
            "value": "recibías"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3s",
            "value": "recibía"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "1p",
            "value": "recibíamos"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "recibían"
          },
          {
            "mood": "indicative",
            "tense": "impf",
            "person": "3p",
            "value": "recibían"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_tu",
            "value": "has recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2p_vosotros",
            "value": "habéis recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1s",
            "value": "he recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "2s_vos",
            "value": "has recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3s",
            "value": "ha recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "1p",
            "value": "hemos recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han recibido"
          },
          {
            "mood": "indicative",
            "tense": "pretPerf",
            "person": "3p",
            "value": "han recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_tu",
            "value": "habías recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2p_vosotros",
            "value": "habíais recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1s",
            "value": "había recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "2s_vos",
            "value": "habías recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3s",
            "value": "había recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "1p",
            "value": "habíamos recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían recibido"
          },
          {
            "mood": "indicative",
            "tense": "plusc",
            "person": "3p",
            "value": "habían recibido"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "recibiré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_tu",
            "value": "recibirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "recibirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "recibiremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2p_vosotros",
            "value": "recibiréis"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "recibirán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1s",
            "value": "recibiré"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "2s_vos",
            "value": "recibirás"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3s",
            "value": "recibirá"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "1p",
            "value": "recibiremos"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "recibirán"
          },
          {
            "mood": "indicative",
            "tense": "fut",
            "person": "3p",
            "value": "recibirán"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_tu",
            "value": "habrás recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2p_vosotros",
            "value": "habréis recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1s",
            "value": "habré recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "2s_vos",
            "value": "habrás recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3s",
            "value": "habrá recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "1p",
            "value": "habremos recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán recibido"
          },
          {
            "mood": "indicative",
            "tense": "futPerf",
            "person": "3p",
            "value": "habrán recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "reciba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_tu",
            "value": "recibas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "reciba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "recibamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2p_vosotros",
            "value": "recibáis"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "reciban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1s",
            "value": "reciba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "2s_vos",
            "value": "recibas"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3s",
            "value": "reciba"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "1p",
            "value": "recibamos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "reciban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPres",
            "person": "3p",
            "value": "reciban"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_tu",
            "value": "hayas recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2p_vosotros",
            "value": "hayáis recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1s",
            "value": "haya recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "2s_vos",
            "value": "hayas recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3s",
            "value": "haya recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "1p",
            "value": "hayamos recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPerf",
            "person": "3p",
            "value": "hayan recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "recibiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_tu",
            "value": "recibieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "recibiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "recibiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2p_vosotros",
            "value": "recibierais"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "recibieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1s",
            "value": "recibiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "2s_vos",
            "value": "recibieras"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3s",
            "value": "recibiera"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "1p",
            "value": "recibiéramos"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "recibieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjImpf",
            "person": "3p",
            "value": "recibieran"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_tu",
            "value": "hubieras recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2p_vosotros",
            "value": "hubierais recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1s",
            "value": "hubiera recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "2s_vos",
            "value": "hubieras recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3s",
            "value": "hubiera recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "1p",
            "value": "hubiéramos recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran recibido"
          },
          {
            "mood": "subjunctive",
            "tense": "subjPlusc",
            "person": "3p",
            "value": "hubieran recibido"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_tu",
            "value": "recibe"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "reciba"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "recibamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2p_vosotros",
            "value": "recibid"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "reciban"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "2s_vos",
            "value": "recibí"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3s",
            "value": "reciba"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "1p",
            "value": "recibamos"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "reciban"
          },
          {
            "mood": "imperative",
            "tense": "impAff",
            "person": "3p",
            "value": "reciban"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_tu",
            "value": "no recibas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no reciba"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no recibamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2p_vosotros",
            "value": "no recibáis"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no reciban"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "2s_vos",
            "value": "no recibas"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3s",
            "value": "no reciba"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "1p",
            "value": "no recibamos"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no reciban"
          },
          {
            "mood": "imperative",
            "tense": "impNeg",
            "person": "3p",
            "value": "no reciban"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "recibiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_tu",
            "value": "recibirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "recibiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "recibiríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2p_vosotros",
            "value": "recibiríais"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "recibirían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1s",
            "value": "recibiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "2s_vos",
            "value": "recibirías"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3s",
            "value": "recibiría"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "1p",
            "value": "recibiríamos"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "recibirían"
          },
          {
            "mood": "conditional",
            "tense": "cond",
            "person": "3p",
            "value": "recibirían"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_tu",
            "value": "habrías recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2p_vosotros",
            "value": "habríais recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1s",
            "value": "habría recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "2s_vos",
            "value": "habrías recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3s",
            "value": "habría recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "1p",
            "value": "habríamos recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían recibido"
          },
          {
            "mood": "conditional",
            "tense": "condPerf",
            "person": "3p",
            "value": "habrían recibido"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "part",
            "value": "recibido"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "ger",
            "value": "recibiendo"
          }
        ]
      }
    ]
  },
  {
    "id": "andar",
    "lemma": "andar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "ando"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "andas",
            "accepts": {
              "vos": "andás"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "andás",
            "accepts": {
              "tu": "andas"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "anda"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "andamos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "andáis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "andan"
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "andado"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "andando"
          }
        ]
      }
    ]
  },
  {
    "id": "servir",
    "lemma": "servir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "sirvo",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "sirves",
            "rules": ["STEM_E_I"],
            "accepts": {
              "vos": "servís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "servís",
            "rules": ["STEM_E_I"],
            "accepts": {
              "tu": "sirves"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "sirve",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "servimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "servís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "sirven",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "serví"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "serviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "serviste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "sirvió",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "servimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "servisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "sirvieron",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "servir"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "sirviendo",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "servido"
          }
        ]
      }
    ]
  },
  {
    "id": "leer",
    "lemma": "leer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "leo"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "lees",
            "accepts": {
              "vos": "leés"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "leés",
            "accepts": {
              "tu": "lees"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "lee"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "leemos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "leéis"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "leen"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "leí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "leíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "leíste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "leyó",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "leímos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "leísteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "leyeron",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "leer"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "leyendo",
            "rules": ["HIATUS_Y"]
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "leído"
          }
        ]
      }
    ]
  },
  {
    "id": "repetir",
    "lemma": "repetir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "repito",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "repites",
            "rules": ["STEM_E_I"],
            "accepts": {
              "vos": "repetís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "repetís",
            "accepts": {
              "tu": "repites"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "repite",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "repetimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "repetís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "repiten",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "repetí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "repetiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "repetiste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "repitió",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "repetimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "repetisteis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "repitieron",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "repetir"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "repitiendo",
            "rules": ["STEM_E_I"]
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "repetido"
          }
        ]
      }
    ]
  },
  {
    "id": "morir",
    "lemma": "morir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": [
          "rioplatense",
          "la_general",
          "peninsular"
        ],
        "forms": [
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1s",
            "value": "muero",
            "rules": ["DIPHT_O_UE"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_tu",
            "value": "mueres",
            "rules": ["DIPHT_O_UE"],
            "accepts": {
              "vos": "morís"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2s_vos",
            "value": "morís",
            "accepts": {
              "tu": "mueres"
            }
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3s",
            "value": "muere",
            "rules": ["DIPHT_O_UE"]
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "1p",
            "value": "morimos"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "2p_vosotros",
            "value": "morís"
          },
          {
            "mood": "indicative",
            "tense": "pres",
            "person": "3p",
            "value": "mueren",
            "rules": ["DIPHT_O_UE"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1s",
            "value": "morí"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_tu",
            "value": "moriste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2s_vos",
            "value": "moriste"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3s",
            "value": "murió",
            "rules": ["STEM_O_U"]
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "1p",
            "value": "morimos"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "2p_vosotros",
            "value": "moristeis"
          },
          {
            "mood": "indicative",
            "tense": "pretIndef",
            "person": "3p",
            "value": "murieron",
            "rules": ["STEM_O_U"]
          },
          {
            "mood": "nonfinite",
            "tense": "inf",
            "person": "inv",
            "value": "morir"
          },
          {
            "mood": "nonfinite",
            "tense": "ger",
            "person": "inv",
            "value": "muriendo",
            "rules": ["STEM_O_U"]
          },
          {
            "mood": "nonfinite",
            "tense": "part",
            "person": "inv",
            "value": "muerto"
          }
        ]
      }
    ]
  }
]

// Combinar todos los verbos eliminando duplicados
const allVerbsWithDuplicates = [...baseVerbs, ...additionalVerbs, ...priorityVerbs]
const verbMap = new Map()

// Eliminar duplicados manteniendo el último encontrado
allVerbsWithDuplicates.forEach(verb => {
  verbMap.set(verb.lemma, verb)
})

export const verbs = Array.from(verbMap.values())
