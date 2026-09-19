import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ActivityTimeline } from "./timeline";
import { EventCard } from "./event-card";
import { PostCard } from "./post-card";

describe("Site Sections Components", () => {
  it("renders PostCard with title, excerpt, date and link", () => {
    const post = {
      slug: "temporada-incendios-2026",
      title: "Arranca la temporada de prevención",
      excerpt: "Reforzamos recorridos y brechas cortafuego en el bosque.",
      coverKey: null,
      coverAlt: null,
      publishedAt: new Date("2026-03-15T12:00:00Z"),
    };

    render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Arranca la temporada de prevención")).toBeInTheDocument();
    expect(screen.getByText("Reforzamos recorridos y brechas cortafuego en el bosque.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Arranca la temporada/i })).toHaveAttribute(
      "href",
      "/noticias/temporada-incendios-2026",
    );
  });

  it("renders EventCard with day, month, title and time", () => {
    const event = {
      id: "event-1",
      title: "Jornada de reforestación comunitaria",
      description: "Traer ropa cómoda y agua.",
      location: "Paraje Las Tinajas",
      startsAt: "2026-06-20T09:00:00Z",
      endsAt: "2026-06-20T13:00:00Z",
    };

    render(<EventCard event={event} />);

    expect(screen.getByText("Jornada de reforestación comunitaria")).toBeInTheDocument();
    expect(screen.getByText("Paraje Las Tinajas")).toBeInTheDocument();
    expect(screen.getByText("Traer ropa cómoda y agua.")).toBeInTheDocument();
  });

  it("renders ActivityTimeline with events list and badges", () => {
    const activities = [
      {
        id: "act-1",
        type: "vigilancia" as const,
        title: "Recorrido dominical de vigilancia",
        description: "Sin incidentes relevantes en el cuadrante sur.",
        occurredOn: "2026-09-10",
        location: "Llano Grande",
        participants: 8,
      },
    ];

    render(<ActivityTimeline items={activities} />);

    expect(screen.getByText("Recorrido dominical de vigilancia")).toBeInTheDocument();
    expect(screen.getByText("Sin incidentes relevantes en el cuadrante sur.")).toBeInTheDocument();
    expect(screen.getByText(/8 participantes/)).toBeInTheDocument();
    expect(screen.getByText("Recorrido de vigilancia")).toBeInTheDocument();
  });
});
