import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";

export interface Profile {
  id: string;
  name: string;
  age: number;
  distance: string;
  bio: string;
  image: string;
  interests: string[];
  prompt: string;
  promptAnswer: string;
}

export const profiles: Profile[] = [
  {
    id: "1",
    name: "Sarah",
    age: 25,
    distance: "2 mi away",
    bio: "Dog mom • Coffee addict • Will laugh at your jokes even if they're bad",
    image: profile1,
    interests: ["Hiking", "Coffee", "Dogs", "Photography"],
    prompt: "My biggest fumble was...",
    promptAnswer: "Waving back at someone who wasn't waving at me. For 30 seconds.",
  },
  {
    id: "2",
    name: "Jake",
    age: 28,
    distance: "5 mi away",
    bio: "6'1\" since everyone asks • Makes a mean pasta • Probably funnier than you",
    image: profile2,
    interests: ["Cooking", "Basketball", "Music", "Travel"],
    prompt: "I'm convinced that...",
    promptAnswer: "Pineapple on pizza is elite and I will die on this hill.",
  },
  {
    id: "3",
    name: "Maya",
    age: 30,
    distance: "1 mi away",
    bio: "Bookworm who also lifts • Your mom will love me • Chronically early",
    image: profile3,
    interests: ["Reading", "Fitness", "Wine", "Art"],
    prompt: "The way to my heart is...",
    promptAnswer: "A perfectly curated Spotify playlist and fancy cheese.",
  },
  {
    id: "4",
    name: "Alex",
    age: 26,
    distance: "3 mi away",
    bio: "Design nerd • Plant dad • Will remember your coffee order after one date",
    image: profile4,
    interests: ["Design", "Plants", "Gaming", "Yoga"],
    prompt: "On a Sunday you'll find me...",
    promptAnswer: "Talking to my plants like they understand relationship advice.",
  },
];
