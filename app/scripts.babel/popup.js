const domain = 'https://url.leanapp.cn';

var QR = Vue.extend({
  template: '<img :src="dataURL" width="150" height="150" class="qr"/>',
  props: ['url'],
  computed: {
    dataURL: function () {
      console.log(this.url);
      return this.url ? qr.toDataURL({
        value: this.url,
        size: 6,
      }) : null;
    },
  },
});
Vue.component('qr', QR);

chrome.tabs.query({ active: true }, ([tab]) => {
  const originalURL = tab.url;

  let vm = new Vue({
    el: '#app',
    data: {
      originalURL,
      path: null,
      domain,
      editingMode: 0,
      customPath: '',
    },
    computed: {
      shortURL: function () {
        return this.path ? `${this.domain}/${this.path}` : null;
      }
    },
    methods: {
      copy: function() {
        const textarea = document.createElement('textarea');
        textarea.textContent = this.shortURL;
        var body = document.getElementsByTagName('body')[0];
        body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        body.removeChild(textarea);
      },
      edit: function() {
        this.editingMode = 1;
      },
      cancel: function() {
        this.editingMode = 0;
        this.customPath = '';
      },
      post: function() {
        fetch(`${domain}/${this.customPath}`, {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'PUT',
          body: JSON.stringify({
            original: this.originalURL,
            short: this.customPath,
          }),
        }).then(response => response.json()).then(result => {
          this.path = result.short;
          this.cancel();
        }).catch(console.error.bind(console));
        this.editingMode = 2;
      }
    },
  });

  fetch(`${domain}/urls`, {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({original: originalURL}),
  }).then(response => response.json()).then(result => {
    window.vm = vm;
    vm.path = result.short;
  }).catch(console.error.bind(console));
});