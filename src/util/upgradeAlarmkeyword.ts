import { generateResources } from './generateResources.js';

export function upgradeAlarmkeyword(
	originalKeyword: string,
	newKeyword: string
) {
	let upgradeKeyword: string;
	// checken, ob alarmkeyword das originale alarmkeyword enthält
	if (newKeyword.includes(originalKeyword)) {
		// falls ja, vorheriges alarmkeyword abtrennen, sodass nur der nachalarmierungsteil übrig bleibt F2[Wohn.]+F3 -> +F3
		upgradeKeyword = newKeyword.replace(originalKeyword, '').replace('+', '');
	} else {
		upgradeKeyword = newKeyword;
	}

	return generateResources(upgradeKeyword); //! Wo differenzieren?
}

// wenn alarmkeyword übrig bleibt, prüfen ob gleiche einsatzklasse, dann differenzieren

// wenn nicht gleiche einsatzklasse, checken ob / verwendet wurde, dann differenzieren, sonst addieren

// falls alarmkeyword, das alte alarmkeyword ersetzen, also statt F2[Wohn.] -> F3

// wenn modul übrig bleibt, adddieren

// das oder die module zum ursprünglichen alarmkeyword hinzufügen
