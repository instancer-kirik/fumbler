export interface MissedConnection {
  id: string;
  title: string;
  location: string;
  time: string;
  description: string;
  lookingFor: string;
  postedAgo: string;
  category: "romantic" | "friendly" | "funny";
}

export const missedConnections: MissedConnection[] = [
  {
    id: "mc1",
    title: "Coffee shop eye contact ☕",
    location: "Blue Bottle Coffee, 3rd & Main",
    time: "Tuesday morning ~9am",
    description: "You were reading a dog-eared copy of Normal People. I was the one who almost tripped over a chair trying not to stare. We made eye contact twice and you smiled.",
    lookingFor: "You: brunette, green jacket. Me: tall, spilled my latte.",
    postedAgo: "2h ago",
    category: "romantic",
  },
  {
    id: "mc2",
    title: "Dance floor confession 💃",
    location: "The Rabbit Hole, Downtown",
    time: "Saturday night",
    description: "We danced to that one Frank Ocean song and you told me your name but the music was too loud. I nodded and pretended I heard it. Classic fumble.",
    lookingFor: "You had the best laugh I've ever heard.",
    postedAgo: "5h ago",
    category: "romantic",
  },
  {
    id: "mc3",
    title: "Grocery store debate 🥑",
    location: "Trader Joe's on Elm",
    time: "Wednesday afternoon",
    description: "We both reached for the last bag of everything bagel seasoning. You let me have it and said 'you owe me one.' I think about it daily.",
    lookingFor: "You: great taste in seasoning. Me: the one who owes you.",
    postedAgo: "1d ago",
    category: "funny",
  },
  {
    id: "mc4",
    title: "Dog park bestie energy 🐕",
    location: "Riverside Dog Park",
    time: "Sunday mornings",
    description: "Our dogs are obsessed with each other but we've never exchanged more than small talk. Your golden retriever and my corgi are basically dating already.",
    lookingFor: "Let's be friends! Our dogs demand it.",
    postedAgo: "3h ago",
    category: "friendly",
  },
  {
    id: "mc5",
    title: "Bookstore philosophy 📚",
    location: "Powell's Books, Pearl District",
    time: "Last Thursday evening",
    description: "You recommended Camus to me in the philosophy section and I panicked and said 'thanks, I love cooking books.' I do not love cooking books.",
    lookingFor: "Me: the existential crisis in aisle 4.",
    postedAgo: "12h ago",
    category: "funny",
  },
];
