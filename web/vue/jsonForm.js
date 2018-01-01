/**
 * Created by salt on 15.10.2017.
 */
(function() {
    "use strict";

    window.jsonForm = function jsonForm(container, data, conf = {}) {

        function getValue(path, data) {
            if (typeof path === "string") path = path.split("/");
            var lastRef = data;
            for(var i = 0; i < path.length - 1; i++) {
                if (!lastRef[path[i]]) return;
                lastRef = lastRef[path[i]];
            }
            if (!lastRef[path[path.length - 1] ]) return;
            return lastRef[path[path.length - 1]];
        }
        function generate(data, fragment, path = "") {
            let label,
                span,
                input,
                fieldset,
                legend;

            for (let key in data) {
                let nextPath = (path === "")? path + key: path + "/" + key;
                let meta = getValue(nextPath, conf.meta);
                let valueType = typeof data[key];

                if (Array.isArray(data[key]) ) {
                    valueType = "array";
                }
                if (meta && meta.type) {
                    valueType = meta.type;
                }

                switch (valueType) {
                    case 'string':
                    case 'number':
                        label = document.createElement('label');
                        span = document.createElement('span');
                        span.innerHTML = key;
                        input = document.createElement('input');
                        input.dataset.name = key;
                        input.dataset.type = valueType;
                        input.setAttribute("type", valueType);
                        input.setAttribute("placeholder", " input value !");
                        input.setAttribute("value", data[key]);
                        input.setAttribute("name", key);
                        input.setAttribute("step", "any");
                        label.appendChild(span);
                        label.appendChild(input);
                        fragment.appendChild(label);

                        break;
                    case 'select':
                        if (!meta.options) {
                            console.error("type 'select' needs options");
                            return;
                        }
                        label = document.createElement('label');
                        span = document.createElement('span');
                        span.innerHTML = key;
                        let select = document.createElement('select');
                        select.dataset.name = key;
                        select.dataset.type = 'select';
                        select.setAttribute("name", key);
                        for (let i = 0; i < meta.options.length; i++) {
                            let option = document.createElement('option');
                            option.innerHTML = meta.options[i];
                            option.setAttribute("value", meta.options[i]);
                            select.appendChild(option);
                        }
                        select.value = data[key];

                        label.appendChild(span);
                        label.appendChild(select);
                        fragment.appendChild(label);
                        break;
                    case 'boolean':
                        label = document.createElement('label');
                        // label.setAttribute("for", "string");
                        span = document.createElement('span');
                        span.innerHTML = key;
                        input = document.createElement('input');
                        input.setAttribute("type", "checkbox");
                        input.dataset.name = key;
                        input.dataset.type = typeof data[key];
                        if (data[key]) {
                            input.setAttribute("checked", true);
                        } else {
                            input.removeAttribute("checked")
                        }
                        input.setAttribute("name", key);
                        label.appendChild(span);
                        label.appendChild(input);
                        fragment.appendChild(label);
                        break;
                    case 'array':
                        //handle as array
                        fieldset = document.createElement('fieldset');
                        fieldset.dataset.name = key;
                        fieldset.dataset.type = "array";
                        legend = document.createElement('legend');
                        legend.innerHTML = key;

                        let ul = document.createElement('ul');
                        fieldset.appendChild(ul);
                        fieldset.appendChild(legend);
                        fragment.appendChild(fieldset);
                        //create array structure
                        for(let i = 0; i < data[key].length; i++) {
                            let li = document.createElement('li');
                            li.dataset.arrayindex = i;
                            ul.appendChild(li);
                            let o = {};
                            o[i] = data[key][i];
                            generate(o, li, nextPath + "/" + i);
                        }
                        break;
                    case 'object':
                            //handle as object
                        fieldset = document.createElement('fieldset');
                        fieldset.dataset.name = key;
                        fieldset.dataset.type = "object";
                        legend = document.createElement('legend');
                        legend.innerHTML = key;
                        fieldset.appendChild(legend);
                        fragment.appendChild(fieldset);
                        generate(data[key], fieldset, nextPath);
                }
            }
        }
        function parseData(data, root) {
            var lastRef = data,
                elements = root.querySelectorAll(":scope > *[data-type], :scope > label > *[data-type], :scope > ul > li > *[data-type], :scope > ul > li > label > *[data-type]");

            for(let i = 0; i < elements.length; i++) {
                let ele = elements[i];
                let type = ele.dataset.type,
                    name = ele.dataset.name;

                if (!type || !name) continue;
                switch (type) {
                    case "object":
                        data[name] = {};
                        parseData(data[name], ele);
                        break;
                    case "boolean":
                        data[name] = ele.checked;
                        break;
                    case "array":
                        data[name] = [];
                        let childs = ele.querySelectorAll(":scope > ul > li[data-arrayindex]");
                        for(let ii = 0; ii < childs.length; ii++) {
                            data[name][ii] = parseData({}, childs[ii])[ii];
                        }
                        break;
                    case "select":
                        data[name] = ele.value;
                        break;
                    case "string":
                        data[name] = ele.value;
                        break;
                    case "number":
                        data[name] = parseFloat(ele.value);
                        break;
                }

            }
            return data;
        }
        function create(data) {
            container.innerHTML = "";
            let fragment = document.createDocumentFragment();
            let form = document.createElement('form');
            fragment.appendChild(form);
            generate(data, form);
            container.appendChild(fragment);
        }

        //init
        create(data);

        return {
            getData: () => {
                let form = container.querySelector("form");
                return parseData({}, form);
            },
            setData: (data) => {
                create(data);
            }
        };
    };
})();
