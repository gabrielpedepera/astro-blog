---
author: Gabriel Pereira
pubDatetime: 2022-02-09T00:00:00Z
title: Don't let dependencies break your window
postSlug: don-t-let-dependencies-break-your-window
featured: false
draft: false
tags:
  - broken-window-theory
  - refactoring
  - dependencies
ogImage: ""
description: Don't let dependencies break your window
canonicalURL: https://www.gabrielpereira.dev/en/2022/02/09/don-t-let-dependencies-break-your-window
lang: "en"
---

I recently worked in a team that had the mission to get back on the rails an old application (pun intended, as it was an application made with Ruby on Rails). During the process of acquiring context, I noticed that all the dependencies were really outdated, and I started wondering whether this characteristic could be considered a "broken window".

The first time that I heard about the broken windows theory was when I read [The Pragmatic Programmer](https://www.amazon.com/gp/product/0135957052/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=gabrielpedepe-20&creative=9325&linkCode=as2&creativeASIN=0135957052&linkId=998bd5c0fbf14c2ca1cc44c605bc9ceb) book by David Thomas and Andrew Hunt. In this [conversation](https://www.artima.com/articles/dont-live-with-broken-windows) with the authors, Andrew Hunt summarizes what the broken windows theory consists of:

> \[...\] They took a nice car, like a Jaguar, and parked it in the South Bronx in New York. They retreated back to a duck blind, and watched to see what would happen. They left the car parked there for something like four days, and nothing happened. It wasn't touched. So they went up and broke a little window on the side, and went back to the blind. In something like four hours, the car was turned upside down, torched, and stripped - the whole works. They did more studies and developed a "Broken Window Theory." \[...\] We use the broken window theory as a metaphor for managing technical debt on a project.

Also, the solution according to the authors is quite simple:

> Don't leave "broken windows" (bad designs, wrong decisions, or poor code) unrepaired. Fix each one as soon as it is discovered. If there is insufficient time to fix it properly, then board it up. Perhaps you can comment out the offending code, or display a "Not Implemented" message, or substitute dummy data instead. Take some action to prevent further damage and to show that you're on top of the situation.

The authors didn't mention explicitly that outdated dependencies are "broken windows", but perhaps it was inferred implicitly like tech debt. Therefore, in this article, I would like to consider them as "cracked windows" with great potential to become "broken windows".

## Keep dependencies up to date

Libraries and tools that are used in software development are usually under continuous development, which means that new versions are released all the time. Although it's important to keep things up to date, it can be quite painful due to needing to check for updates and having to make sure that nothing is broken after each update.

The decision of how often to update is always up to you, but if this process is usually painful, one suggestion is to do it more frequently. Like Jez Humble mentioned in the [Continuous Delivery](https://www.amazon.com/gp/product/B003YMNVC0/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=gabrielpedepe-20&creative=9325&linkCode=as2&creativeASIN=B003YMNVC0&linkId=6ca002b46fb131acee019ec9e740176c) book:

> If it hurts, do it more frequently, and bring the pain forward.

and also Martin Fowler in the post [Frequency Reduces Difficulty](http://martinfowler.com/bliki/FrequencyReducesDifficulty.html):

> \[...\] if you do it more frequently, you can drastically reduce the pain. And this is what happens with Continuous Integration - by integrating every day, the pain of integration almost vanishes. It did hurt, so you did it more often, and now it no longer hurts.

## Should you update after every dependency release?

Before digging more into this question, let's have a quick look at [Semantic versioning](https://semver.org) (also known as _SemVer_) which is the most commonly used versioning system. You can see it as a way of numbering the software releases:

- Major version: introduces new features, but also some breaking changes. E.g. **1**.0.0 to **2**.0.0
- Minor version: a version of the software with minor modifications or updates and doesn't introduce breaking changes ([at least tries not to introduce them](https://serpapi.com/blog/how-a-routine-gem-update-ended-up-charging/)). E.g. 2.**0**.0 to 2.**1**.0
- Patch Version**:** used for bug fixes. E.g. 2.1.**0** to 2.1.**1**

Updates may range from bug fixes to security vulnerability fixes and even new features. In most cases, skipping an update will not critically deteriorate your application, but it's important to not allow this to become a broken window. Define a routine to update your dependencies recurrently in a way that you can run through all minor and patch updates, and be able to plan heavy updates for later stages.

## Automate dependency updates

Fortunately, a few tools to help you automate your dependency updates already exist, including support for multiple languages, like:

- [Dependabot](https://github.com/dependabot)
- [Dependencies.io](https://www.dependencies.io/)
- [Depfu](https://depfu.com/)
- [Greenkeeper](https://greenkeeper.io/)
- [Renovate](https://renovatebot.com/)

All of them are valid choices, so it's up to you to analyze them carefully and decide which one fits your purpose better.

## Conclusion

Regarding the application that I mentioned at the beginning of this article, we first started updating manually the dependencies through the patches and minors versions, and only after that the major versions. Thankfully, the application's tests were very consistent and trustful which gave us the confidence to update all outdated dependencies. After that, we configured [Depfu](https://depfu.com) to run every week on Monday morning, so that we can start the week with fresh dependencies.

In summary, treat outdated dependencies as cracked windows, and repair them before they become completely broken.

### References

- [https://blog.codinghorror.com/the-broken-window-theory](https://blog.codinghorror.com/the-broken-window-theory/)
- [https://www.artima.com/articles/dont-live-with-broken-windows](https://www.artima.com/articles/dont-live-with-broken-windows)
- [https://martinfowler.com/bliki/FrequencyReducesDifficulty.html](https://martinfowler.com/bliki/FrequencyReducesDifficulty.html)
- [https://ottofeller.com/blog/reasons-to-keep-codebase-dependencies-up-to-date](https://ottofeller.com/blog/reasons-to-keep-codebase-dependencies-up-to-date)
- [https://depfu.com/blog/2016/12/01/why-you-should-keep-your-dependencies-up-to-date](https://depfu.com/blog/2016/12/01/why-you-should-keep-your-dependencies-up-to-date)
- [https://ruleoftech.com/2021/automate-your-dependency-management-using-update-tool](https://ruleoftech.com/2021/automate-your-dependency-management-using-update-tool)
- [https://serpapi.com/blog/how-a-routine-gem-update-ended-up-charging](https://serpapi.com/blog/how-a-routine-gem-update-ended-up-charging/)
