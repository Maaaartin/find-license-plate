import { createApp, reactive } from 'https://unpkg.com/petite-vue?module';

function getSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    licensePlate: params.get('licensePlate') || '',
    selected: params.has('selected') ? params.get('selected').split(',') : [],
  };
}
const store = reactive(
  (() => {
    const { licensePlate, selected } = getSearchParams();
    let searchQueryTimeout;
    return {
      licensePlate,
      openMethod: 'tab',
      onSearchQueryChange(e) {
        if (searchQueryTimeout) clearTimeout(searchQueryTimeout);
        searchQueryTimeout = setTimeout(() => {
          this.licensePlate = e.target.value;
          updateURL('licensePlate');
        }, 300);
      },
      selected,
      onSelectedChange() {
        setTimeout(() => {
          updateURL('selected');
        });
      },
      onOpenMethodChange(e) {
        this.openMethod = e.target.value;
        updateURL('openMethod');
      },
    };
  })()
);

function updateURL(key) {
  const params = new URLSearchParams(window.location.search);
  if (
    typeof store[key] === 'object' ? Object.keys(store[key]).length : store[key]
  ) {
    params.set(key, store[key]);
  } else {
    params.delete(key);
  }
  const newURL =
    window.location.pathname +
    (params.toString() ? `?${params.toString()}` : '');
  window.history.pushState({}, '', newURL);
}

function createCountryOption({
  label,
  value,
  homepage,
  getLink,
  validate = () => true,
}) {
  return { label, value, homepage, getLink, validate };
}

function DynamicCountryList() {
  return {
    $template: '#dynamic-country-list',
    options: [
      createCountryOption({
        label: 'Sweden',
        value: 'SE',
        homepage: 'https://biluppgifter.se/',
        getLink() {
          return `https://biluppgifter.se/fordon/${store.licensePlate}/`;
        },
      }),
      createCountryOption({
        label: 'Denmark',
        value: 'DK',
        homepage: 'https://www.tjekbil.dk/',
        getLink() {
          return `https://www.tjekbil.dk/nummerplade/${store.licensePlate}/overblik`;
        },
        validate() {
          return /^[A-Za-z]{2}\d{5}$/.test(store.licensePlate);
        },
      }),
      createCountryOption({
        label: 'Norway',
        value: 'NO',
        homepage:
          'https://www.vegvesen.no/kjoretoy/kjop-og-salg/kjoretoyopplysninger/sjekk-kjoretoyopplysninger',
        getLink() {
          return `https://www.vegvesen.no/kjoretoy/kjop-og-salg/kjoretoyopplysninger/sjekk-kjoretoyopplysninger/?registreringsnummer=${store.licensePlate}`;
        },
      }),
      createCountryOption({
        label: 'France',
        value: 'FR',
        homepage: 'https://siv-auto.fr/index.php',
        getLink() {
          return `https://siv-auto.fr/index.php?immat=${store.licensePlate}&format=1`;
        },
      }),
      createCountryOption({
        label: 'Italy',
        value: 'IT',
        homepage: 'https://www.letarghe.it/',
        getLink() {
          return `https://www.letarghe.it/targa/ancona/${store.licensePlate.toLowerCase()}`;
        },
      }),
    ],

    mounted() {
      const popStateListener = () => {
        Object.assign(store, getSearchParams());
      };
      window.addEventListener('popstate', popStateListener);
      return () => window.removeEventListener('popstate', popStateListener);
    },
  };
}

function StaticCountryList() {
  return {
    $template: '#static-country-list',
    options: [
      createCountryOption({
        label: 'Portugal',
        value: 'PT',
        homepage: 'https://infomatricula.pt/',
      }),
      createCountryOption({
        label: 'The Netherlands',
        value: 'NL',
        homepage: 'https://ovi.rdw.nl/',
      }),
      createCountryOption({
        label: 'Lithuania',
        value: 'LT',
        homepage:
          'https://www.eregitra.lt/services/vehicle-registration/data-search',
      }),
    ],
  };
}

function CountryOption({ option }) {
  const tabs = new Set();
  function updateTabs() {
    if (!store.selected.includes(option.value)) {
      return;
    }
    const link = option.getLink(store.licensePlate);
    Array.from(tabs).forEach((tab) => {
      if (tab.closed) {
        tabs.delete(tab);
      } else {
        tab.location.href = link;
      }
    });
  }
  function openTabIfSelected() {
    if (
      store.selected.includes(option.value) &&
      store.licensePlate &&
      (!tabs.size || !Array.from(tabs).some((tab) => !tab.closed))
    ) {
      const tab = window.open(
        option.getLink(store.licensePlate),
        '_blank',
        store.openMethod === 'window'
          ? 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes'
          : ''
      );
      tabs.add(tab);
    }
  }

  return {
    $template: '#country-option',
    ...option,
    mounted() {
      openTabIfSelected();
      navigation.addEventListener('navigate', updateTabs);
      return () => navigation.removeEventListener('navigate', updateTabs);
    },
    openTabIfSelected,
  };
}

createApp({
  store,
  DynamicCountryList,
  StaticCountryList,
  CountryOption,
}).mount();
