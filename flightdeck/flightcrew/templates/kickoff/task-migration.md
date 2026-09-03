<!-- version: 1 -->
## Task: migration
The work is a sweep: the same mechanical change across many call sites, with behaviour held constant. Cut the units by area of the tree, not by behaviour, and size each one so its diff stays readable.
Wave 0 lands the new shape and the compatibility surface, and its contract check proves the old and the new forms agree. Every later unit converts one area and re-runs the same behavioural checks; the acceptance check proves the old form is gone.
Hold the line that a migration changes no behaviour: a unit that finds a defect on the way reports it as a finding and converts the call site as it stands. Fixing it inside the sweep hides it from the diff and from the critic.
Risks worth naming: a call site the sweep cannot reach, a check that passes because both forms are present, and a rename that collides with an unconverted area.
