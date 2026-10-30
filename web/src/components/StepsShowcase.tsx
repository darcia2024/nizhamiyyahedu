import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseCard } from "@/lib/queries";

type Step = { title: string; text: string };

export function StepsShowcase({ steps, courses, linkLabel = "Lihat contoh silabus" }: { steps: Step[]; courses: CourseCard[]; linkLabel?: string }) {
  const lead = courses[0];
  return (
    <ol className="learning-steps">
      {steps.map((step, index) => (
        <li key={index}>
          <span className="learning-step-number">0{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
          {index === 0 && lead && <Link href={`/kursus/${lead.slug}`}>{linkLabel} <ArrowRight size={15} aria-hidden="true" /></Link>}
        </li>
      ))}
    </ol>
  );
}
