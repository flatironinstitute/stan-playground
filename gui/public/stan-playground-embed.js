/*
Define a custom HTML element <stan-playground-embed> that embeds a Stan Playground iframe.

Usage:
<stan-playground-embed>
<iframe width="100%" height="500" frameborder="0"></iframe>

<script type="text/plain" class="stan-program">
... Stan program ...
</script>

<script type="text/plain" class="stan-data">
... JSON data ...
</script>

</stan-playground-embed>

You can also specify the Stan program URL and data URL via attributes:
<stan-playground-embed stan="relative-or-absolute-url-to-stan-program" data="relative-or-absolute-url-to-data">
<iframe width="100%" height="500" frameborder="0"></iframe>
</stan-playground-embed>
*/
class StanPlaygroundEmbed extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Initialize immediately if document is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.initialize()
      );
    } else {
      this.initialize();
    }
  }

  initialize() {
    // Get existing iframe
    this.iframe = this.querySelector("iframe");
    if (!this.iframe) {
      console.error("Missing iframe element in stan-playground-embed");
      return;
    }

    const encodePlain = (text) => {
      // replace &lt; and &gt; with < and >
      const text2 = text.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      return "data:text/plain;charset=utf-8," + encodeURIComponent(text2);
    };

    // Extract and hide program and data elements
    const programElement = this.querySelector("script.stan-program");
    const dataElement = this.querySelector("script.stan-data");

    let stanUrl;
    if (programElement) {
      const stanProgram = programElement.textContent.trim();
      stanUrl = encodePlain(stanProgram);
    }
    else if (this.attributes.stan) {
      stanUrl = this.attributes.stan.value;
      if (stanUrl.startsWith("./")) {
        const baseUrl = window.location.href;
        stanUrl = new URL(stanUrl, baseUrl).href;
      }
    }
    else {
      console.error("Missing stan-program script element or stan attribute");
      return;
    }

    let dataUrl;
    if (dataElement) {
      const stanData = dataElement.textContent.trim();
      dataUrl = encodePlain(stanData);
    }
    else if (this.attributes.data) {
      dataUrl = this.attributes.data.value;
      if (dataUrl.startsWith("./")) {
        const baseUrl = window.location.href;
        dataUrl = new URL(dataUrl, baseUrl).href;
      }
    }
    else {
      console.error("Missing stan-data script element or data attribute");
      return;
    }

    // Get Stan Playground URL from attribute or use default
    const defaultStanPlaygroundUrl = "https://stan-playground.flatironinstitute.org";
    const stanPlaygroundUrl = this.attributes["stan-playground-url"]?.value || defaultStanPlaygroundUrl;

    // Set iframe src
    this.iframe.src = `${stanPlaygroundUrl}/embedded?stan=${encodeURIComponent(stanUrl)}&data=${encodeURIComponent(dataUrl)}`;
  }
}

customElements.define("stan-playground-embed", StanPlaygroundEmbed);