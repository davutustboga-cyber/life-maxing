// types.ts — gedeelde types, gespiegeld aan datamodel.md en de content/*.yaml bestanden.
export function leegBestand() {
    return {
        versie: "1.0",
        aangemaaktOp: null,
        instellingen: {
            islamitischeLaag: true,
            rustigeBeelden: false,
            ethischeOndergrensGezien: false,
            weekmomentAan: true,
        },
        woordenUitbreiding: [],
        momenten: [],
        sterren: [],
        sterrenbeelden: [],
        onderdrukkingen: [],
        sterrenbeeldAanbodAfgewezen: [],
        brieven: [],
        weekmomenten: [],
        perfectionismeChecks: [],
        frictieAangebodenMaanden: [],
        wieIkWord: null,
        verlangenVanDePeriode: null,
        ochtendMomenten: [],
        dagsluitingen: [],
        doel: null,
    };
}
