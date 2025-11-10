"use client"

import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * Animation timing constants
 *
 * CRITICAL: These values control the tab indicator animation behavior
 *
 * @constant ANIMATION_DELAY_MS - Delay before enabling animations (50ms)
 *   - Purpose: Ensure initial tab position is set without animation
 *   - Why 50ms: Minimum delay to guarantee React state update completion
 *   - Bug prevention: Using React state instead of ref to ensure re-render
 *
 * @constant TRANSITION_DURATION_MS - Tab indicator slide animation duration (250ms)
 *   - Based on: iOS HIG, Material Design 3, Ant Design 5 standards
 *   - Range: 200-300ms is standard for UI transitions
 *   - User perception: Fast enough to feel responsive, slow enough to perceive
 *
 * @constant TRANSITION_EASING - Animation curve (ease-out)
 *   - cubic-bezier(0.4, 0, 0.2, 1): Standard ease-out curve
 *   - Behavior: Fast start, smooth deceleration
 *   - Why: Creates natural, physics-based motion
 */
const ANIMATION_DELAY_MS = 50;
const TRANSITION_DURATION_MS = 250;
const TRANSITION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Tabs Component - Architecture Overview
 *
 * CRITICAL: This component structure must be maintained for proper z-index layering.
 *
 * Structure:
 * ```
 * <TabsPrimitive.List> (relative)
 *   ├─ <div> Indicator (z-0, absolute) ← Bottom layer
 *   └─ {children} TabsTrigger (z-10, relative) ← Top layer
 * ```
 *
 * Why this structure:
 * 1. Indicator is a child of TabsList, not a sibling
 * 2. z-0 ensures indicator stays below text
 * 3. TabsTrigger (z-10) ensures text is always readable
 * 4. TabsList (relative) provides positioning context
 *
 * DO NOT:
 * - Move indicator outside TabsList
 * - Remove z-index values
 * - Change the order of children
 * - Remove relative positioning from TabsList
 */

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const tabsListRef = useRef<HTMLDivElement | null>(null);

  /**
   * Animation control state
   *
   * CRITICAL: Must use state (not ref) to ensure re-render when enabled
   *
   * Initial value: false (no animation on first render)
   * After ANIMATION_DELAY_MS: true (enable smooth transitions)
   *
   * Bug prevention history:
   * - Initially used ref, but ref changes don't trigger re-renders
   * - Result: Initial animation occurred (left-to-right slide bug)
   * - Solution: Use state to guarantee re-render when animation is enabled
   */
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Combine refs
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      tabsListRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  const updateIndicator = useCallback(() => {
    if (!tabsListRef.current) return;

    const activeTab = tabsListRef.current.querySelector<HTMLElement>(
      '[data-state="active"]'
    );
    if (!activeTab) return;

    const activeRect = activeTab.getBoundingClientRect();
    const tabsRect = tabsListRef.current.getBoundingClientRect();

    // No margin - full coverage for better visual feedback
    const margin = 0;

    requestAnimationFrame(() => {
      setIndicatorStyle({
        left: activeRect.left - tabsRect.left + margin,
        top: activeRect.top - tabsRect.top + margin,
        width: activeRect.width - margin * 2,
        height: activeRect.height - margin * 2,
      });
    });
  }, []);

  useEffect(() => {
    // Initial update
    const timeoutId = setTimeout(updateIndicator, 0);

    // Enable animation after initial render is complete
    const animationTimeoutId = setTimeout(() => {
      setShouldAnimate(true);
    }, ANIMATION_DELAY_MS);

    // Event listeners
    window.addEventListener("resize", updateIndicator);
    const observer = new MutationObserver(updateIndicator);

    if (tabsListRef.current) {
      observer.observe(tabsListRef.current, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(animationTimeoutId);
      window.removeEventListener("resize", updateIndicator);
      observer.disconnect();
    };
  }, [updateIndicator]);

  return (
    <TabsPrimitive.List
      ref={combinedRef}
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center justify-center bg-white/30 backdrop-blur-sm text-muted-foreground relative",
        // Design system tokens for consistent sizing
        "h-[var(--tabs-list-height)] md:h-[var(--tabs-list-height-md)]",
        // Horizontal padding from design system, vertical padding matches TabsTrigger
        "px-[var(--tabs-list-padding)] py-2",
        "rounded-[var(--tabs-list-radius)]",
        className
      )}
      {...props}
    >
      {/*
        CRITICAL STRUCTURE - DO NOT REORDER
        1. Indicator must be first child (z-0 = bottom layer)
        2. Children must be after indicator (z-10 = top layer)
      */}

      {/* Active indicator - positioned at bottom layer (z-0) */}
      <div
        className="absolute z-0 bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm pointer-events-none rounded-[var(--tabs-indicator-radius)]"
        style={{
          ...indicatorStyle,
          // Smooth animation for tab switches, instant on initial mount
          // Using left/width only for horizontal slide
          transition: shouldAnimate
            ? `left ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, width ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`
            : 'none',
          // Always visible once positioned
          opacity: indicatorStyle.width === 0 ? 0 : 1,
        }}
        aria-hidden="true"
      />

      {/* Children (TabsTrigger) - positioned at top layer (z-10) */}
      {children}
    </TabsPrimitive.List>
  );
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(
      // CRITICAL: z-10 relative ensures text appears above indicator (z-0)
      // DO NOT remove z-10 or relative positioning
      "inline-flex items-center justify-center whitespace-nowrap border border-transparent py-2 text-sm md:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 disabled:pointer-events-none disabled:opacity-50 text-gray-700 font-medium hover:text-gray-900 hover:bg-purple-100/30 data-[state=active]:text-gray-900 z-10 relative",
      // Increased horizontal padding for better spacing
      "px-5 md:px-6 lg:px-7",
      // Match indicator radius for visual consistency
      "rounded-[var(--tabs-indicator-radius)]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(
      "mt-2 flex-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
