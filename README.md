## Team members
Aidyn Somerville, Suba Senthil 

## Purpose
Noteify is a shared notes platform that helps students overcome disorganization by letting them upload their own notes and explore organized, course-specific notes from their peers.

## Inspiration
Every semester, students are overwhelmed by information like slides, lectures, screenshots, handwritten notes, half-finished docs.  Classes can move so fast which makes it easy to fall behind, and the real challenge isn’t studying; it’s finding and organizing what actually helps. When high-quality resources are scattered or inaccessible, students default to whatever is easiest to find or rely on generic AI tools that can miss course-specific context or hallucinate information. 

We’re building a shared notes platform inspired by a simple belief that students learn better when knowledge is easy to find and shared with care. By combining a forum feed where students can post their notes under course-specific tags, structured academic metadata, and AI-powered transcription and summarization, we turn scattered notes into accessible, searchable learning support.

This project is about more than notes: Noteify promotes sustainable learning by reducing waste, repetition, and isolation through shared, course-specific knowledge. By anchoring AI to relevant student-generated materials, we reduce misinformation, preserve academic context, and make collaboration feel human, approachable, and organized.

## What it does
Noteify is a shared notes forum that helps students find reliable, course-specific learning resources in one place. Students upload notes and tag them by course, professor, and semester. An AI layer then transcribes and summarizes this content, making it searchable, organized, and easy to reuse.

## How we built it
This is a scalable full-stack web application that uses Next.js and React for the frontend and app routing, and Supabase for authentication, storage, and a relational database to manage users, courses, posts, and metadata. We integrated Google Gemini to power AI transcription and summarization.

## Challenges we ran into
One of the bigger challenges was working with Supabase since it was a new backend for our team. While it handled authentication, storage, and data management really well, we had to be extra cautious about hidden security issues we might overlook due to inexperience. 

We also found it challenging (time consuming) to connect Supabase data cleanly to the frontend. Keeping the database structure, queries, and UI in sync required a lot of iteration and debugging.

Integrating Google Gemini also came with challenges. We had to carefully shape its behavior so summaries and transcriptions stayed strictly based on the student’s uploaded files, rather than pulling in outside information or making assumptions.

Finally, with a tight hackathon timeline, we had to stay focused on the core MVP. There were plenty of features we wanted to add, but prioritizing the essentials helped us deliver a solid, working product by the deadline.

## Accomplishments that we're proud of
We’re proud to have built a full-stack platform that combines structured academic metadata with AI-powered transcription and summarization. By grounding insights in real, student-generated materials, Noteify reaches a major milestone that sets it apart and lays a strong foundation for sustainable and collaborative learning.

## What we learned
We learned that scalability depends on clean architecture! Separating concerns between the frontend (Next.js), backend logic, storage, and AI services (Supabase + Gemini) made the system easier to debug, extend, and iterate on.
We learned the importance of structuring data before applying AI. AI outputs are only as reliable as the context they’re given, and grounding models in course-specific metadata and student-uploaded content significantly reduced irrelevant or inaccurate responses.

## What's next for Noteify
Next, we plan to expand Noteify beyond note sharing by community and social features by adding upvotes, comments, and contributor profiles, helping high-quality notes stand out while encouraging collaboration and peer-to-peer learning. We’ll also deepen our AI support with practice questions, revision summaries, and cross-note connections. We’ll also leverage AI-powered moderation to flag inappropriate content, low-quality uploads, and harmful comments, helping maintain a safe, trustworthy academic community.

We also aim to build school-specific communities while maintaining academic context and trust. Long term, Noteify becomes a sustainable knowledge archive where learning compounds over semesters, reducing repeated effort and making academic support more accessible for every student. 



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
