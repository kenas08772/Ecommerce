function productValidation(){

    // input Fields

    const name = document.getElementById("name");
    const quantity = document.getElementById("quantity");
    const brand = document.getElementById("brand");
    const discription = document.getElementById("discription");
    const images = document.getElementById("images");
    const price = document.getElementById("price");
    const category = document.getElementById("category");
 

    //Error Field

    const nameErr = document.getElementById("nameErr");
    const quantityErr = document.getElementById("quantityErr");
    const brandErr = document.getElementById("brandErr");
    const discriptionErr = document.getElementById("discriptionErr");
    const imagesErr = document.getElementById("imagesErr");
    const priceErr = document.getElementById("priceErr");
    const categoryErr = document.getElementById("categoryErr");


    //regex

    const nameRegex = /^[A-Z]/;
    const quantityRegex = /^[0-9]/;
    const brandRegex = /^[A-Z]/;
    const descriptionRegex = /^(\S+\s+){9}\S+$/;
    const imagesRegex = /\.(jpg|jpeg|png|gif)$/i;
    const priceRegex = /^[0-9]/



    //name


    // if (name.value.trim() === "") {
    //     nameErr.style.color="red";
    //     nameErr.innerHTML = "Please Enter The Name...";
    //     setTimeout(() => {
    //         emailError.innerHTML = "";
    //     }, 5000);
    //     return false;
    // }
    // if (!nameRegex.test(name.value)) {
    //     nameErr.style.color="red";
    //     nameErr.innerHTML = "Invalid Name Format";
    //     setTimeout(() => {
    //         nameErr.innerHTML = "";
    //     }, 5000);
    //     return false;
    // }



    // if (name.value.trim() === "") {
    //     nameErr.style.color="red";
    //     nameErr.innerHTML = "Please Enter The Name...";
    //     setTimeout(() => {
    //         emailError.innerHTML = "";
    //     }, 5000);
    //     return false;
    // }
    // if (!nameRegex.test(name.value)) {
    //     nameErr.style.color="red";
    //     nameErr.innerHTML = "Invalid Name Format";
    //     setTimeout(() => {
    //         nameErr.innerHTML = "";
    //     }, 5000);
    //     return false;
    // }

    if (value.trim() === "") {
        errorElement.style.color = "red";
        errorElement.innerHTML = "Please enter the required information...";
        setTimeout(() => {
          errorElement.innerHTML = "";
        }, 5000);
        return false;
      }
    
      if (!regex.test(value)) {
        errorElement.style.color = "red";
        errorElement.innerHTML = errorMessage;
        setTimeout(() => {
          errorElement.innerHTML = "";
        }, 5000);
        return false;
      }
    
      return true;
    }
    
    // Validate each field using the function
    if (!validateField(name.value, nameRegex, nameErr, "Invalid Name Format")) {
      return false;
    }
    
    if (!validateField(quantity.value, quantityRegex, quantityErr, "Invalid Quantity Format")) {
      return false;
    }
    
    if (!validateField(brand.value, brandRegex, brandErr, "Invalid Brand Format")) {
      return false;
    }
    
    if (!validateField(discription.value, descriptionRegex, discriptionErr, "Invalid Description Format")) {
      return false;
    }
    
    if (!validateField(images.value, imagesRegex, imagesErr, "Invalid Image Format")) {
      return false;
    }
    
    if (!validateField(price.value, priceRegex, priceErr, "Invalid Price Format")) {
      return false;
    }
    
    if (!validateField(category.value, categoryRegex, categoryErr, "Invalid Category Format")) {
      return false;
    }
    
    // Continue validation for other fields as needed
    
    // If all validations pass, you can proceed with submitting the form
    return true;


