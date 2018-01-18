const countries = {
  france: require('./facts/france'),
  norway: require('./facts/norway'),
}

exports.getRandomFact = country => {
  const allRandomFacts = countries[country].facts
  const randomFact = allRandomFacts[Math.floor(Math.random()*allRandomFacts.length)]
  return randomFact
}
