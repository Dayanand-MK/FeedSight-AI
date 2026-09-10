from ai.inference.predictor import predictor


def test_fqi_prediction():

    prediction = predictor.predict(
        ph=3.9240887,
        ammonia=6.15441278235604,
        lactic_acid=4.1623033537176095,
        acetic_acid=0.8866076104480436,
        propionic_acid=0.08879627926035623,
        butyric_acid=0.051487352022822265,
        ethanol=1.015835932383953,
        mannitol=0.7959282865984258,
        dry_matter=35.5662594,
        starch=31.853532676122487
    )

    assert isinstance(prediction, float)

    assert 0 <= prediction <= 100

    assert abs(prediction - 40.53) < 0.5