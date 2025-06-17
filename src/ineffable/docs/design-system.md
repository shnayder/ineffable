# Design system

# Colors
Based on
https://imperavi.com/blog/designing-semantic-colors-for-your-system/

Basic structure: Role.Property.Tone.State

This is a fairly complete set of possible values. Only use as needed!

- Role: 
    - Surface — colors for general backgrounds, elevation, layers, popup components, and focus state borders.
    - Black & white utility colors
    - Input & link
    - Primary, Neutral & States (Active, Focus, Negative, Notice, Secondary) — Accent colors or state-specific colors.
    - Chart, Gradient, and others as needed
- Property: Background (bg), Border, Foreground (fg)
- Tone: 
    - bg & border
        - Intensity (ghost, dimmed, minimal, subtle, medium, strong, intense)
        - accent, accent-hover
        - for dark backgrounds (rich, deep, abyss)
        - static: solid colors that remain unchanged regardless of theme
    - fg
        - accent
        - subtle -- for secondary labels and text
        - minimal -- minimal acceptable contrast
        - and special use cases: heading, body, perhaps icon, static (fixed regardless of theme)
- State: Hover, Press, Focus, Disabled


Principles
- match: e.g. minimal backgrounds should pair with minimal border and minimal foreground
- start small, expand as needed

## CSS

Define these in index.css as e.g.
- --color-neutral-fg
- --color-primary-bg-subtle
- --color-primary-border-subtle-focus

And use via tailwind
- className="text-primary-fg-subtle"


#### Surface
- bg-body — The general background of a website or application.
- bg-base — Used for card backgrounds or other content, matching the general background.
- bg-raised — Used in dark themes to highlight a surface, making it distinct from the general background.
- bg-overlay — Used for the background of dropdowns, modals, and other popups. In dark themes, it’s usually lighter than the general background.
- bg-overlay-hover — Used for hover states of popup elements, such as a dropdown menu item.
- bg-overlay-active — Used for active states of popup elements, such as a selected item in a dropdown.
- border-focus — Used for borders and focus rings when a button, input, or other component receives focus.

#### Black and white
- Base — Black tones with varying transparency that turn white in dark themes. For example, text will be black in light themes and white (or nearly white) in dark themes.
- Inverted — White tones that, conversely, turn black in dark themes. For instance, if you have a dark background with a button featuring an inverted (white) background, in the dark theme, the background will become white, and the button black—inverted.
- Black — A static black color that remains black in any theme.
- White — A static white color that remains white in any theme.

#### Input & link

Input

- fg-placeholder — Text color for placeholders inside inputs.
- bg-input — Background color for input fields.
- bg-input-focus — Background color for input fields in the focus state.
- bg-input-on — Background color for input components in the “on” state, such as toggles.
- bg-input-off — Background color for input components in the “off” state.
- bg-input-disabled — Background color for input fields in the disabled state.
- border-input — Border color for input fields.
- border-input-focus — Border color when an input field is focused or the cursor is inside it.

Link
 - base, hover, active

