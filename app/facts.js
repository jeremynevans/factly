const countries = {
  always: { facts: ['repeat!'] },
  france: require('./facts/france'),
  norway: require('./facts/norway'),
  germany: require('./facts/germany'),
  czech: require('./facts/czech'),
  slovakia: require('./facts/slovakia'),
}

exports.getRandomFact = country => {
  const allRandomFacts = countries[country].facts
  const randomFact = allRandomFacts[Math.floor(Math.random()*allRandomFacts.length)]
  return randomFact
}
