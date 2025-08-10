/* Combined Website Scripts */
document.addEventListener("DOMContentLoaded", async () => {
    /* Loader Animation */
    const loader = document.querySelector(".loader");
    if (loader) {
        // Wait for animation to complete (1.6s + 0.7s for max delay)
        setTimeout(() => {
            loader.classList.add("slide-up");
            // Hide loader after slide-up transition
            setTimeout(() => {
                loader.style.display = "none";
            }, 1000); // Matches 1s transition in CSS
        }, 2300); // 1.6s animation + 0.7s delay for last letter
    } else {
        console.warn("Loader element not found.");
    }

    /* Tab Navigation */
    const tabLinks = document.querySelectorAll(".feature-tab-link");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const tabsContainer = document.querySelector(".tabs");
    
    if (tabsContainer && tabLinks.length && tabPanes.length) {
        function switchTab(event) {
            event.preventDefault();
            const targetTab = event.currentTarget.getAttribute("data-w-tab");
            
            tabLinks.forEach((link) => {
                link.classList.remove("w--current");
            });
            event.currentTarget.classList.add("w--current");

            tabPanes.forEach((pane) => {
                pane.classList.remove("w--tab-active");
                pane.style.display = "none";
            });

            const targetPane = document.querySelector(`.tab-pane[data-w-tab="${targetTab}"]`);
            if (targetPane) {
                targetPane.classList.add("w--tab-active");
                targetPane.style.display = "block";
                tabsContainer.setAttribute("data-current", targetTab);
            }
        }

        tabLinks.forEach((link) => {
            link.addEventListener("click", switchTab);
        });

        // Initialize the active tab
        const currentTab = tabsContainer.getAttribute("data-current");
        const initialTabLink = document.querySelector(`.feature-tab-link[data-w-tab="${currentTab}"]`);
        const initialTabPane = document.querySelector(`.tab-pane[data-w-tab="${currentTab}"]`);
        
        if (initialTabLink && initialTabPane) {
            initialTabLink.classList.add("w--current");
            initialTabPane.classList.add("w--tab-active");
            initialTabPane.style.display = "block";
        }
    } else {
        console.warn("Tab navigation elements not found.");
    }

    /* Reusable Slideshow Logic */
    function createSlideshow(prefix, slideshowSelector, slideSelector, prevButtonSelector, nextButtonSelector, playButtonSelector, videoContainerSelector, slideshowContainerSelector) {
        const slideshow = document.querySelector(slideshowSelector);
        const slides = document.querySelectorAll(slideSelector);
        const prevButton = document.querySelector(prevButtonSelector);
        const nextButton = document.querySelector(nextButtonSelector);
        const playButtons = document.querySelectorAll(playButtonSelector);
        let currentIndex = 0;
        let isDragging = false;
        let startPos = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationID;

        if (!slideshow || !slides.length || !prevButton || !nextButton) {
            console.warn(`${prefix} slideshow elements not found.`);
            return;
        }

        async function updateVideoContainers() {
            const promises = Array.from(slides).map((slide) => {
                return new Promise((resolve) => {
                    const video = slide.querySelector("video");
                    const container = slide.querySelector(videoContainerSelector);
                    if (!video || !container) {
                        resolve();
                        return;
                    }
                    // Set fallback dimensions
                    container.style.width = `${window.innerWidth * 0.8}px`;
                    container.style.height = `${window.innerHeight * 0.8}px`;
                    
                    if (video.readyState >= 2) {
                        const aspectRatio = video.videoWidth / video.videoHeight;
                        const maxWidth = window.innerWidth * 0.8;
                        const maxHeight = window.innerHeight * 0.8;
                        let width = video.videoWidth;
                        let height = video.videoHeight;

                        if (width > maxWidth) {
                            width = maxWidth;
                            height = width / aspectRatio;
                        }
                        if (height > maxHeight) {
                            height = maxHeight;
                            width = height * aspectRatio;
                        }

                        container.style.width = `${width}px`;
                        container.style.height = `${height}px`;
                        resolve();
                    } else {
                        video.addEventListener(
                            "loadedmetadata",
                            () => {
                                const aspectRatio = video.videoWidth / video.videoHeight;
                                const maxWidth = window.innerWidth * 0.8;
                                const maxHeight = window.innerHeight * 0.8;
                                let width = video.videoWidth;
                                let height = video.videoHeight;

                                if (width > maxWidth) {
                                    width = maxWidth;
                                    height = width / aspectRatio;
                                }
                                if (height > maxHeight) {
                                    height = maxHeight;
                                    width = height * aspectRatio;
                                }

                                container.style.width = `${width}px`;
                                container.style.height = `${height}px`;
                                resolve();
                            },
                            { once: true }
                        );
                    }
                });
            });
            await Promise.all(promises);
        }

        function updateSlideshow() {
            const slideWidths = Array.from(slides).map((slide) => slide.offsetWidth + 24);
            const containerWidth = document.querySelector(slideshowContainerSelector).offsetWidth;
            const previousSlidesWidth = slideWidths.slice(0, currentIndex).reduce((a, b) => a + b, 0);
            const currentSlideWidth = slideWidths[currentIndex];
            const slideCenter = previousSlidesWidth + currentSlideWidth / 2;
            const containerCenter = containerWidth / 2;
            currentTranslate = containerCenter - slideCenter;

            slideshow.style.transform = `translateX(${currentTranslate}px)`;

            slides.forEach((slide, index) => {
                slide.classList.toggle("active", index === currentIndex);
            });
        }

        function nextSlide() {
            currentIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
            updateSlideshow();
        }

        function prevSlide() {
            currentIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
            updateSlideshow();
        }

        playButtons.forEach((button, index) => {
            const video = slides[index].querySelector("video");
            if (video) {
                button.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (video.paused) {
                        video.play();
                        button.textContent = "Pause";
                    } else {
                        video.pause();
                        button.textContent = "Play";
                    }
                });
            }
        });

        function startDragging(e) {
            if (e.target.classList.contains(`${prefix}-play-button`)) {
                return;
            }
            isDragging = true;
            startPos = getPositionX(e);
            slideshow.style.cursor = "grabbing";
            animationID = requestAnimationFrame(animation);
        }

        function drag(e) {
            if (isDragging) {
                if (e.target.classList.contains(`${prefix}-play-button`)) {
                    return;
                }
                const currentPosition = getPositionX(e);
                const diff = currentPosition - startPos;
                slideshow.style.transform = `translateX(${prevTranslate + diff}px)`;
            }
        }

        function stopDragging() {
            if (isDragging) {
                isDragging = false;
                slideshow.style.cursor = "grab";
                cancelAnimationFrame(animationID);

                const slideWidths = Array.from(slides).map((slide) => slide.offsetWidth + 24);
                const movedBy = currentTranslate - prevTranslate;
                const threshold = slideWidths[currentIndex] / 2;

                if (movedBy < -threshold && currentIndex < slides.length - 1) {
                    currentIndex++;
                } else if (movedBy > threshold && currentIndex > 0) {
                    currentIndex--;
                }
                prevTranslate = currentTranslate;
                updateSlideshow();
            }
        }

        function animation() {
            if (isDragging) {
                requestAnimationFrame(animation);
            }
        }

        function getPositionX(e) {
            return e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
        }

        

        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener("resize", async () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(async () => {
                await updateVideoContainers();
                updateSlideshow();
            }, 100);
        });

        prevButton.addEventListener("click", prevSlide);
        nextButton.addEventListener("click", nextSlide);

        slideshow.addEventListener("mousedown", startDragging);
        slideshow.addEventListener("touchstart", startDragging);
        slideshow.addEventListener("mousemove", drag);
        slideshow.addEventListener("touchmove", drag);
        slideshow.addEventListener("mouseup", stopDragging);
        slideshow.addEventListener("touchend", stopDragging);
        slideshow.addEventListener("mouseleave", stopDragging);
    }

    /* Initialize Slideshows */
    createSlideshow(
        "hs",
        ".hs-slides",
        ".hs-slides li",
        ".hs-prev-button",
        ".hs-next-button",
        ".hs-play-button",
        ".hs-video-container",
        ".h-slideshow-container"
    );
    createSlideshow(
        "sf",
        ".sf-slides",
        ".sf-slides li",
        ".sf-prev-button",
        ".sf-next-button",
        ".sf-play-button",
        ".sf-video-container",
        ".sf-slideshow-container"
    );
});