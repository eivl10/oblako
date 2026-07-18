# Tag Cloud Project Knowledge

When working on this 3D Tag Cloud project in the future, please keep these successful technical solutions in mind:

1. **Interactive Physics (Dragging Words):** 
   The `TagCanvas` library natively doesn't support "dragging" words out of the sphere. We achieved this by conditionally reading the hovered tag via `tc.active`, pausing the `TagCanvas` interaction, rendering a duplicate 2D HTML element (`#dragged-word`) under the cursor, and using standard DOM `mousemove`/`touchmove` for drag logic. Return physics used simple velocity/friction simulated via `requestAnimationFrame`.

2. **Mobile Support:** 
   Always bind `touchstart`, `touchmove`, and `touchend` to ensure mobile devices can drag without scrolling the viewport. The crucial part is calling `e.preventDefault()` inside the `touchmove` listener (which requires the listener to be attached with `{passive: false}`).

3. **Responsive Canvas Sizing:** 
   On mobile screens (`< 768px`), we use `width: 130vw` on the `canvas` to scale the internal text rendering up so the words become larger and more readable. We placed `overflow: hidden` on the `#app` container to avoid horizontal scrolling/white bars caused by the oversized canvas.

4. **Easter Eggs (Image blending):** 
   For Easter Eggs that spawn images (like drawn hearts on a white background), `mix-blend-mode: multiply` successfully masks out the white background against the pastel aurora background natively, without needing a PNG with transparency.

5. **Words Management:** 
   The list of words and their sizes is decoupled from the physics logic and stored in `words.js` to allow the user to edit it easily.
