// Main JavaScript for Yuming He's website

document.addEventListener('DOMContentLoaded', () => {
  // Publication views: keep the chronological view derived from the topic cards.
  const topicView = document.querySelector('#publications-by-topic');
  const yearView = document.querySelector('#publications-by-year');
  const viewButtons = document.querySelectorAll('.publication-view-button');

  if (topicView && yearView && viewButtons.length) {
    const publicationsByYear = [...topicView.querySelectorAll('.publication')]
      .reduce((groups, publication) => {
        const year = publication.dataset.year;
        if (!groups.has(year)) groups.set(year, []);
        groups.get(year).push(publication);
        return groups;
      }, new Map());

    [...publicationsByYear.keys()]
      .sort((first, second) => Number(second) - Number(first))
      .forEach(year => {
        const group = document.createElement('div');
        group.className = 'publication-group';
        group.innerHTML = `<h3 class="publication-category">${year}</h3>`;
        publicationsByYear.get(year).forEach(publication => {
          const copy = publication.cloneNode(true);
          copy.removeAttribute('data-year');
          group.append(copy);
        });
        yearView.append(group);
      });

    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const showYearView = button.id === 'publications-by-year-tab';
        topicView.hidden = showYearView;
        yearView.hidden = !showYearView;
        viewButtons.forEach(viewButton => {
          const isActive = viewButton === button;
          viewButton.classList.toggle('active', isActive);
          viewButton.setAttribute('aria-selected', String(isActive));
        });
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for header
          behavior: 'smooth'
        });
      }
    });
  });

  // Add active class to nav links based on scroll position
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('nav a');
  
  function highlightNavLink() {
    let scrollPosition = window.scrollY;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  
  window.addEventListener('scroll', highlightNavLink);
  
  // Animation on scroll
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.project-card, .publication, .talk');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight;
      
      if (elementPosition < screenPosition - 100) {
        element.classList.add('fade-in');
      }
    });
  };
  
  window.addEventListener('scroll', animateOnScroll);
  animateOnScroll(); // Run once on load
});
