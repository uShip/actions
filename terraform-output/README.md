# `uShip/actions/terraform-output`

This action assists in neatly formatting and presenting terraform plan, as well as other step output. Assumes you're using the `hashicorp/setup-terraform` action which wraps stdout and stderr into neat outputs.

```yml
      - uses: uShip/actions/terraform-output@null
        with:
          # JSON-ified step outcomes
          steps: ${{ toJSON(steps) }} # required
  
          # Step ids of various steps.
          # Change if you're using non-default step ids
          # for terraform steps.
          fmt: fmt             # default
          init: init           # default
          validate: validate   # default
          plan: plan           # default

          # Whether or not to fail if any of the previous
          # steps failed.
          fail-on-error: "true" # default

          # The github token to use
          token: ${{ github.token }} # default

          # A unique id to differentiate between multiple terraform-output actions
          # Useful if a single pr may run multiple terraform plans
          context: ""
```

<details><summary><b>Example Usage</b></summary>

```yml
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1

      - name: Terraform fmt
        id: fmt
        run: terraform fmt -check

      - name: Terraform Init
        id: init
        run: terraform init

      - name: Terraform Validate
        id: validate
        run: terraform validate

      - name: Terraform Plan
        id: plan
        run: terraform plan

      - uses: uShip/actions/terraform-output@null
        if: ${{ always() }}
        with:
          steps: ${{ toJSON(steps) }}
```
</details>
