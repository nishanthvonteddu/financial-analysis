import type React from "react";
import Image from "next/image";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Glow } from "@/components/ui/glow";
import { Mockup } from "@/components/ui/mockup";
import { cn } from "@/lib/utils";

interface HeroWithMockupProps {
  title: string;
  description: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
  mockupImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  className?: string;
}

export function HeroWithMockup({
  title,
  description,
  primaryCta = {
    href: "/register",
    text: "Get Started",
  },
  secondaryCta = {
    href: "/dashboard",
    icon: <BarChart3 className="mr-2 size-4" aria-hidden="true" />,
    text: "View Dashboard",
  },
  mockupImage,
  className,
}: HeroWithMockupProps) {
  return (
    <section
      className={cn(
        "relative w-full max-w-full overflow-hidden bg-background px-4 py-12 text-foreground md:py-24 lg:py-32",
        className,
      )}
    >
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-12 lg:gap-24">
        <div className="hero-with-mockup-content relative z-10 flex w-full max-w-full flex-col items-center gap-6 pt-8 text-center md:pt-16 lg:gap-12">
          <h1 className="inline-block max-w-[22rem] animate-appear bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-4xl font-bold leading-[1.1] tracking-tight text-transparent drop-shadow-sm sm:max-w-4xl sm:text-5xl sm:leading-[1.1] md:text-6xl lg:text-7xl xl:text-8xl dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {title}
          </h1>

          <p className="max-w-[20rem] animate-appear text-base font-medium text-muted-foreground opacity-0 [animation-delay:150ms] sm:max-w-[590px] sm:text-lg md:text-xl">
            {description}
          </p>

          <div className="relative z-10 flex animate-appear flex-wrap justify-center gap-4 opacity-0 [animation-delay:300ms]">
            <Button
              asChild
              className="bg-gradient-to-b from-brand to-brand/90 text-white shadow-lg transition-all duration-300 hover:from-brand/95 hover:to-brand/85 dark:from-brand/90 dark:to-brand/80 dark:hover:from-brand/80 dark:hover:to-brand/70"
              size="lg"
            >
              <a href={primaryCta.href}>{primaryCta.text}</a>
            </Button>

            <Button
              asChild
              className="text-foreground/80 transition-all duration-300 dark:text-foreground/70"
              size="lg"
              variant="ghost"
            >
              <a href={secondaryCta.href}>
                {secondaryCta.icon}
                {secondaryCta.text}
              </a>
            </Button>
          </div>

          <div className="relative w-full max-w-full px-0 pt-12 sm:px-6 lg:px-8">
            <Mockup className="animate-appear border-brand/10 opacity-0 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] [animation-delay:700ms] dark:border-brand/5 dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]">
              <Image
                alt={mockupImage.alt}
                className="h-auto w-full"
                decoding="async"
                height={mockupImage.height}
                loading="lazy"
                src={mockupImage.src}
                width={mockupImage.width}
              />
            </Mockup>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Glow
          className="animate-appear-zoom opacity-0 [animation-delay:1000ms]"
          variant="above"
        />
      </div>
    </section>
  );
}
